#!/usr/bin/python

# script to find all unit tests and run perf on them,
# then collect runtime, as well as hot functions
# store these in db="test"
# table: "date_hash" (datetime, hashtag)
# table: test_runtime (testname, date, cycle, time_in_sec(float)
# table: liquid_perf (testname, funcname, time, percentage, githash)

import os, fnmatch, sys
import pprint
import subprocess
import time
from datetime import date
import MySQLdb

# mimic source in shell
def shell_source(script):
    """Sometime you want to emulate the action of "source" in bash,
    settings some environment variables. Here is a way to do it."""
    import subprocess, os
    pipe = subprocess.Popen(". %s; env" % script, stdout=subprocess.PIPE, shell=True)
    output = pipe.communicate()[0]
    env = dict((line.split("=", 1) for line in output.splitlines()))
    os.environ.update(env)

liquid_path="/home/ywang2/temp/graph-fiber_trunk/"
os.chdir(liquid_path)
shell_source(liquid_path + "graph-fiber/release-static/env")


#user name and password for mysql

db = MySQLdb.connect(host="localhost", # your host, usually localhost
                     user="ywang2", # your username
                     passwd="", # your password
                     db="test") # name of the data base

# you must create a Cursor object. It will let
#  you execute all the queries you need
cur = db.cursor() 

# get date
today = str(date.today().year) + '-' + str(date.today().month) + '-' + str(date.today().day)
print today

#get git hash
git=os.popen("git rev-parse HEAD")
githash = git.read()
print githash

git=os.popen("git show -s --format=%ci HEAD")
headdatetime = git.read()

#do the perf test only if this commit hasn't been tested
cur.execute("SELECT * FROM date_hash where hash=" + "\"" + githash + "\"")
if len(cur.fetchall()) > 0:
    sys.exit("this commit with date " + headdatetime + "and hashtag " + githash + "has already been perf tested, aborting...")
else:
    print "adding date " + headdatetime + " and githash " + githash + " to tested_hashtag table"
    cur.execute("INSERT INTO date_hash VALUES(\"" + headdatetime + "\", \"" + githash + "\")")

frequency = 20000

#find all test
t=os.popen("find " + liquid_path + "graph-fiber/release-static/test-graph/ -type f -executable")
tests=t.read()
#print tests
tests=tests.split('\n')
print "-------------"
for test in tests:
    if test =="":
        break
    print "-------------"
    r = subprocess.call(["perf", "record", "-e", "cpu-clock", "--freq=" + str(frequency), test])
    if r==0:
        res=os.popen("perf report")
        perf_data = res.read()
        perf_data = perf_data.split('\n')
        cycle = 1.0
        time_in_sec = 0.0
        testname = ""

        for line in perf_data:
            line = line.rstrip().lstrip()
            #print line
            # logic to generate profiling data
            # get total runtime
            if line.find("# Samples") != -1:
                token = line.split()
                cycle = float(token[2].rstrip("kKmM"))
                if token[2].find("k") != -1 or token[2].find("K") != -1:
                    cycle = cycle * 1000
                if token[2].find("m") != -1 or token[2].find("M") != -1:
                    cycle = cycle * 1000000
                time_in_sec = float(cycle/frequency)
                print "cycle "+str(cycle)+"freq "+str(frequency)+"time "+str(time_in_sec)
            # generate function hot map
            if line.find("[k]") != -1 or line.find("[.]") != -1:
                #print "found one perf record: " + line
                tokenized = line.split()
                if len(tokenized) < 4:
                    print "misformatted record" + line
                    break
                #print tokenized
                percent  = float(tokenized[0].rstrip("\%"))
                # don't bother to store the record if time consumption is small than 1%
                if percent < 1:
                    continue
                lib = tokenized[2]
                kernel_func = tokenized[3]
                funcname = ""
                for func in tokenized[4:]:
                    funcname = funcname + ' ' + func
                testname = test.split("/")[-1]
                print "testname: " + testname + " percent: " + str(percent) + " library: " + lib + " function: " + funcname + " githash: " + githash
                #write the record into mysql. testname functionname, datetime, percent, githash
                cur.execute("INSERT IGNORE INTO liquid_perf VALUES(\"" + testname + "\", \"" + funcname +
                             "\", \"" + headdatetime +  "\", \"" + str(percent) +  "\", \"" + githash + "\")")

        #now put the test time into db (testname, date, cycle, time_in_sec)
        cur.execute("INSERT IGNORE INTO test_runtime VALUES(\"" + testname + "\", \"" + headdatetime +
                    "\", \"" + str(int(cycle)) +  "\", \"" + str(time_in_sec) + "\")")

                
