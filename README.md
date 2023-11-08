# lang

Just a language that's still under development. If you still want to try it out, then do the following steps:
1. Clone repo via Git or GitHub
   - Via Git: `git clone https://github.com/notcl4y14/lang.git`
   - Via GitHub: Click the `<> Code` button, and then `Download ZIP`
2. Type in command line `npm install` (You should have node.js installed)
   - Since this is written in typescript, type also `npm install -g ts-node` to run it
3. Now to run it, type `lang %*`, %* replace with arguments
   - If you don't have Windows, then type `ts-node --project ./tsconfig.json . %*`, %* replace with arguments

# TODO
- Optimize and make the code cleaner
- Overcomment interpreter.ts and other uncommented files because Idk why
- ~~Make functions to create runtime values~~
- ~~Make functions for node classes to set position like `new IdentifierNode("lol").setPos(leftPos, rightPos);`~~
- ~~Change left and right positions for nodes and errors~~
- ~~Change the right position for tokens in the lexer~~
- Probably make getting filename not from the position
