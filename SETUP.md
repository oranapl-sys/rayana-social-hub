# Setting up the Rayana Social Hub

About 20 minutes, once. You do every step on GitHub yourself: nobody else needs your password.

There are two repositories:

| Repository | Visibility | What's in it |
|---|---|---|
| `rayana-social-hub` | **Public** | The app's code only. No business data, ever. GitHub Pages turns it into a website. |
| `rayana-social-data` | **Private** | Everything you and the agent write: ideas, references, pictures, the plan, the platform guidelines. |

The website on its own shows nothing. It only opens your data when a device has your key.

---

## 0. Make a GitHub account (if you don't have one)

1. Go to github.com and choose **Sign up**. The free plan is enough. Pick a username you're happy to see in the hub's address (`USERNAME.github.io/rayana-social-hub`).
2. After signing in: your picture (top right), **Settings**, then **Emails**. Tick **Keep my email addresses private**. GitHub then shows you a private address like `12345678+USERNAME@users.noreply.github.com`.
3. Send the agent that private address. The commits on this PC use a placeholder (`hub@localhost`) until then, and the agent switches them to your private address before the first push, so your real email never shows on the public repository.

## 1. Make the private data repository

1. Sign in at github.com. Top right, **+**, then **New repository**.
2. Repository name: `rayana-social-data`.
3. Choose **Private**.
4. Leave "Add a README" **unticked** (the starter already has one).
5. **Create repository**.

**Put the starter files in it**, one of two ways:

- **Easiest:** tell the agent in chat "push the data starter". It runs `git push` from the PC (`C:\Users\orana\rayana-social-data`). The first time, a GitHub sign-in window opens: you sign in there yourself.
- **By hand:** on the new repository's page, click **uploading an existing file**, then drag in everything inside `C:\Users\orana\rayana-social-data` (the folders `platforms`, `hub`, `references`, `ideas`, `posts`, `media` and the `README.md`). **Commit changes**.

## 2. Make the public app repository and turn on GitHub Pages

1. **+**, then **New repository**. Name: `rayana-social-hub`. Choose **Public**. Leave "Add a README" unticked. **Create repository**.
2. Get the code in: tell the agent "push the hub" (it pushes `C:\Users\orana\Rayana Social Hub`), or upload the folder's files by hand as above. Don't upload the `.mock-data` folder if you see one: it's local test data.
3. In the repository: **Settings**, then **Pages** (left menu).
4. Under **Build and deployment**: Source **Deploy from a branch**, Branch **main**, folder **/ (root)**. **Save**.
5. After a minute or two the page shows your address, something like `https://YOUR-USERNAME.github.io/rayana-social-hub/`. Bookmark it.

## 3. Make a key for each device

The key is a *fine-grained personal access token*. It can only touch the data repository, and you can cancel it any time.

1. On GitHub: your picture (top right), **Settings**.
2. Left menu, at the bottom: **Developer settings**, then **Personal access tokens**, then **Fine-grained tokens**.
3. **Generate new token**.
4. **Token name:** the device, for example `Oran phone hub`.
5. **Expiration:** 1 year (put a reminder in your calendar to make a new one).
6. **Repository access:** **Only select repositories**, then pick `rayana-social-data`.
7. **Permissions:** open **Repository permissions**, find **Contents**, choose **Read and write**. (Metadata: read-only is added by itself. Leave everything else as No access.)
8. **Generate token**. Copy it straight away: GitHub shows it only once.

**For Naomi's view-only access:** make another token the same way, but with **Contents: Read-only**. The hub then hides every edit button on her device.

## 4. Connect your phone

1. Open the hub address on your phone in Chrome.
2. Fill in your GitHub username, the repository (`rayana-social-data`), and paste the key. **Connect**.
3. Chrome menu (⋮), then **Add to home screen**. It opens like an app.
4. **Bonus on Android:** once it's on the home screen, the hub appears in the share menu. In Instagram or TikTok, tap **Share**, then **Rayana Hub**, and the link is ready to save as a reference.

Do the same on the computer if you want it there too (one key per device is tidiest).

## If something goes wrong

- **"GitHub refused the key":** the key expired or was pasted wrong. Make a new one (step 3) and paste it in **Settings, Change key or repository**.
- **"Can't find rayana-social-data":** check the spelling, and that the key was given access to that repository.
- **"This key can read but not save":** the key has Contents: Read-only. Make one with Read and write.
- **Lost a phone:** GitHub, Settings, Developer settings, Fine-grained tokens: delete that device's key. The data is safe; the phone can no longer reach it.

## What the app never does

It never publishes, schedules, replies or posts anything. Statuses like "Approved in chat" are records. The go-ahead to publish is always your message to the agent in chat.

## Working on the app (for the agent)

```
node tools/dev-server.mjs        # http://localhost:5173
```

The dev server serves the app and a fake GitHub API backed by `.mock-data/` (ignored by git), seeded from `..\rayana-social-data`. Choose **Use local test data** on the connect screen. `--reset` starts the test data again from the starter.
