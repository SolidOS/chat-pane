# chat-pane

Solid-compatible chat discussion applet for solid-panes framework

Extracted from the solid-panes monolithic repository.

Do add your wishlists to the issue list for a solid based (safe based etc) chat system. Things other chat systems you ave seen do, Things you can imagine a solid chat system doing because it is linked data, things you think would really help people collaborate

You can build with `npm install && npm run build && cd dist && npx serve`.
You can debug with VSCode + Chrome (see `.vscode/launch.json`).

## Development
`npm run dev`

## Deploy stand-alone

You can deploy this code as a stand-alone Solid app.
The way to do that depends on your html-app hosting provider.
For instance, to deploy to https://solid-chat.5apps.com/ you would:

```sh
git checkout deploy # this branch has dist/ commented out in .gitignore
git merge master
npm ci
npm run build
git add dist/
git commit --no-verify -am"build"
git remote add 5apps git@5apps.com:michiel_chat.git
git push 5apps deploy:master
```