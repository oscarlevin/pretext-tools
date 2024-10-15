interface CLI {
    _pythonPath: string | null;
    _pythonVersion: string| null;
    _pretextVersion: string | null;
    _cmd: string | null;
    pythonPath: (override?: string|null) => string;
}

export let cli: CLI = {
    _pythonPath: null,
    _pythonVersion: null,
    _pretextVersion: null,
    _cmd: null,
    pythonPath: function (override?: string|null) {
        if (override) {
            this._pythonPath = override;
        }
        if (this._pythonPath === null) {
            this._pythonPath = Date.now().toString();
        }
        return this._pythonPath;
    }
}