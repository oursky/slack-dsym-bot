loadAddress=`echo "obase=16;ibase=10;$(($1-$2))" | bc`
atos -o $3 -l $loadAddress $1 -arch arm64