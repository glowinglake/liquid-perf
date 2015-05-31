#!/bin/bash

#update trunk and build, then run test
#scheduled on weekday mornings
#all commands are run as root by cronjob, except git access
date >> /home/ywang2/python/liquid_perf/execution.log
cd /home/ywang2/temp/graph-fiber_trunk/
su -s /bin/bash -c "git fetch origin"
git rebase origin/master
/usr/local/linkedin/bin/mint build
if [ $? -eq 0 ]
then
    echo "graph-fiber update complete, now running perf and collecting results."  >> /home/ywang2/python/liquid_perf/execution.log
    /home/ywang2/python/liquid_perf/run_test.py  >> /home/ywang2/python/liquid_perf/execution.log
    echo $? >> /home/ywang2/python/liquid_perf/execution.log
    echo " is the result " >> /home/ywang2/python/liquid_perf/execution.log
fi