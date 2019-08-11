Right now the shell scripts are set up to work on a unix system (could probably be run on windows using something like Cygwin).

Installation instructions (needs nodejs/npm):
npm install

Run genetic algorithm (will write the results to the out directory and later copy them into results):
sh shell/analyze.sh

Run only visualization:
node render.js --history --fitness
The history option will output faded out traces of previous generations, and --fitness will output a fitness graph over the generations.

Important notes
The main analysis script is executed from JavaFoil's scripting engine (Nashorn), while the rendering is triggered by spawning a new node process. The reason why we don't render in Nashorn is that Nashorn doesn't support many newer JS features that libraries such as d3js use and it's a bit of a pain to get libraries to work with Nashorn in general. This leads to some annoying inconsistencies in language usage across the project; it's just important to be mindful of what environment your code will be run when deciding whether to use ES6 features and the like.

The good news about this is that potentially the rendering frontend could be reused with a different solver spitting the output to file.

Also, a lot of the IO is a bit clunky and comes from JavaFoil being silly (like writing polar output to disk and then reading it in again in the analysis script). The JavaFoil API documentation is also innaccurate, and I could not for the life of it get it to match with avny version of the methods in the jar. The best way to figure it out is to decompile the jar and look at the method signatures by hand.
