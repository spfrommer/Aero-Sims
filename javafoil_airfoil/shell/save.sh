# Creates a new folder under res and stores the analysis output there

cd res
resCount=$(ls -1 | wc -l)
mkdir "res$resCount"
cd ..
cp -R out/* "res/res$resCount"
