# Executes an analysis

# Calls JavaFoil, passing in our analysis script to execute using Nashorn
# -scripting arg allows use to use the $EXEC method to render the simulation
java -DScript="analysis.js" -Dnashorn.args=-scripting -cp "JavaFoil/mhclasses.jar" -jar "JavaFoil/javafoil.jar"
# java -DScript="analysis.js" -Dnashorn.args=--language=es6--fx -cp "JavaFoil/mhclasses.jar" -jar "JavaFoil/javafoil.jar"
