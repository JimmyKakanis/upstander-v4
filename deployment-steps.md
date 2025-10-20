# Firebase Deployment Steps (After Restart)

This guide will walk you through the final steps to deploy the email notification feature. Please follow these steps in order after you have restarted your computer.

### Step 1: Open a NEW Terminal

After restarting, open a single, new terminal window (like PowerShell or Command Prompt).

### Step 2: Verify `nvm` is Working

Run the following command. You should see a version number printed, which confirms the tool is installed correctly.

```bash
nvm --version
```

### Step 3: Switch to the Correct Node.js Version

Now, tell `nvm` to switch to Node.js version 18 for this terminal session. This is the version required by Firebase.

```bash
nvm use 18
```

### Step 4: Navigate to the Functions Directory

Change your terminal's location to the `functions` sub-directory of the project.

```bash
cd C:\Projects\upstander - v4\functions
```

### Step 5: Clean Up and Install Dependencies

First, remove the old `npm` lock file to prevent any conflicts:
```bash
del package-lock.json
```

Next, use `yarn` to install the project's dependencies. This should now complete without errors.
```bash
yarn install
```

### Step 6: Deploy!

Once the installation is complete, navigate back to the main project root directory:
```bash
cd ..
```

Finally, run the deploy command. This will upload your function to Firebase.
```bash
firebase deploy --only functions
```

---

If you follow these steps, the deployment should complete successfully.

