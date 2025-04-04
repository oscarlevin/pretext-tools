# Install LaTeX or SageMath

The default Codespace image does not include LaTeX or SageMath. You can install them by clicking the buttons on the right or by running the following commands in the terminal:

```bash
bash ./.github/scripts/add-latex.sh
bash ./.github/scripts/add-sage.sh
```

If you don't want to run these every time you create a new codespace for this project, edit the `.devcontainer` file.  Look for the line that starts with
`postCreateCommand` and uncomment the lines for each of those scripts as you like.

Note, the buttons on the left should do this edit for you if you select "always" when prompted.
