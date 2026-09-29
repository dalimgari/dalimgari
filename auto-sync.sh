#!/bin/sh

cd /public/dalimgari || exit 1

while true
do
    sleep 10

    if [ -n "$(git status --porcelain)" ]; then
        git add -A
        git commit -m "Auto sync"
        git push origin main
    fi
done
