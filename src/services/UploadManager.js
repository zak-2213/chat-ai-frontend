// Browser-compatible UploadManager
class UploadManager {
  constructor() {
    // Hardcoded allowed extensions (browser-compatible)
    this.allowedExtensions = {
      image: ["jpeg", "jpg", "gif", "png", "webp"],
      document: ["pdf"],
      text: [
        "html",
        "htm",
        "xhtml",
        "css",
        "scss",
        "sass",
        "less",
        "js",
        "jsx",
        "mjs",
        "ts",
        "fpp",
        "tsx",
        "php",
        "phtml",
        "php3",
        "php4",
        "php5",
        "php7",
        "vue",
        "svelte",
        "py",
        "lsp",
        "lisp",
        "pyw",
        "pyc",
        "pyd",
        "pyo",
        "ipynb",
        "ipynb_checkpoints",
        "c",
        "cc",
        "cpp",
        "cxx",
        "c++",
        "h",
        "hpp",
        "hxx",
        "h++",
        "cs",
        "csx",
        "java",
        "class",
        "jar",
        "kt",
        "kts",
        "groovy",
        "scala",
        "clj",
        "rb",
        "rbw",
        "rake",
        "gemspec",
        "sh",
        "bash",
        "zsh",
        "ps1",
        "psm1",
        "bat",
        "cmd",
        "pl",
        "pm",
        "tcl",
        "asm",
        "s",
        "f",
        "for",
        "f90",
        "f95",
        "swift",
        "m",
        "mm",
        "dart",
        "sql",
        "mysql",
        "pgsql",
        "nosql",
        "go",
        "rs",
        "rlib",
        "lua",
        "ino",
        "ex",
        "exs",
        "erl",
        "hrl",
        "hs",
        "xml",
        "xsl",
        "xslt",
        "json",
        "jsonc",
        "yaml",
        "yml",
        "toml",
        "wasm",
        "wat",
        "r",
        "rmd",
        "jl",
        "d",
        "nim",
        "ml",
        "mli",
        "fs",
        "fsx",
        "coffee",
        "ls",
        "v",
        "zig",
        "pkl",
        "model",
        "weights",
        "tex",
        "txt",
        "rst",
        "md",
        "markdown",
        "cmake",
        "mak",
        "make",
        "gradle",
        "pom",
        "editorconfig",
        "conf",
        "sublime-project",
        "vscode",
        "idea",
        "gitignore",
        "gitattributes",
        "gitmodules",
      ],
    };
  }

  _allowedFile(filename) {
    const parts = filename.split(".");
    if (parts.length < 2) return [null, null];

    const fileExtension = parts.pop().toLowerCase();

    for (const [type, extensions] of Object.entries(this.allowedExtensions)) {
      if (extensions.includes(fileExtension)) {
        return [type, fileExtension];
      }
    }

    return [null, null];
  }

  async upload(file) {
    try {
      return await this._processFile(file);
    } catch (error) {
      console.error(`Upload failed: ${error.message}`);
      return null;
    }
  }

  async _processFile(file) {
    const filename = file.name;
    const [type, fileExtension] = this._allowedFile(filename);

    if (!type || !fileExtension) {
      return null;
    }

    // Read file as array buffer
    const arrayBuffer = await this.readFileAsArrayBuffer(file);
    const encodedData = this.arrayBufferToBase64(arrayBuffer);

    if (type === "image") {
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: file.type,
          data: encodedData,
        },
      };
    } else if (type === "document" && fileExtension === "pdf") {
      return this._processPDF(arrayBuffer);
    } else {
      try {
        const text = await this.readFileAsText(file);
        return {
          type: "text",
          text: text,
        };
      } catch (error) {
        return {
          type: "binary",
          source: {
            type: "base64",
            media_type: file.type,
            data: encodedData,
          },
        };
      }
    }
  }

  async _processPDF(arrayBuffer) {
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();

      if (pageCount > 100) {
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(
          pdfDoc,
          Array.from({ length: Math.min(100, pageCount) }, (_, i) => i),
        );

        pages.forEach((page) => newPdf.addPage(page));
        const truncatedBytes = await newPdf.save();
        return {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: this.arrayBufferToBase64(truncatedBytes),
          },
        };
      }

      return {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: this.arrayBufferToBase64(arrayBuffer),
        },
      };
    } catch (error) {
      console.error("PDF processing error:", error);
      return {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: this.arrayBufferToBase64(arrayBuffer),
        },
      };
    }
  }

  // Browser-compatible file reading
  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;

    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  }
}

export default UploadManager;
