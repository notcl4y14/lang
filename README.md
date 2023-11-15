# lang

Just a language that's still under development. If you still want to try it out, then do the following steps:
1. Clone repo via Git or GitHub
   - Via Git: `git clone https://github.com/notcl4y14/lang.git`
   - Via GitHub: Click the `<> Code` button, and then `Download ZIP`
2. Type in command line `npm install` (You should have node.js installed)
   - Since this is written in typescript, type also `npm install -g ts-node`
3. Now to run it, type `lang %*`, %* replace with arguments
   - If you don't have Windows, then type `ts-node --project ./tsconfig.json . %*`, %* replace with arguments

~~The code is so messed up but I'm not sure if I have to rewrite the lang again rn~~
The code is really messed up. Almost like the Source engine. So it's archived.

# TODO
- Optimize and make the code cleaner
- Overcomment interpreter.ts and other uncommented files because Idk why
- Sort ~~the files and~~ the functions
    + Tried sorting the files, bad idea. Since I have no idea how to make Typescript import like from the folder in that folder
- Make some readers for like JSON and converting arrays into a string
- ~~Make functions to create runtime values~~
- ~~Make functions for node classes to set position like `new IdentifierNode("lol").setPos(leftPos, rightPos);`~~
- ~~Change left and right positions for nodes and errors~~
- ~~Change the right position for tokens in the lexer~~
- Probably make getting filename not from the position

# CREDITS
Thanks to CodePulse and tylerlaceby for tutorials! (Also helped me understand and realize how does the languages work)
- CodePulse: https://www.youtube.com/@CodePulse
- tylerlaceby: https://www.youtube.com/@tylerlaceby
