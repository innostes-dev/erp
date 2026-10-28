# Security Policy

## Supported Versions

Only the latest major release of `@innostes/ui` receives security patches and vulnerability remediations:

| Version | Supported          |
| :------ | :----------------- |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in `@innostes/ui` or its subpaths (`@innostes/ui/charts`, `@innostes/ui/editor`), please do NOT disclose it publicly on GitHub issues or community forums.

Report vulnerabilities via email to:
**security@innostes.com**

Please include:
1. A description of the vulnerability and affected component(s).
2. Step-by-step reproduction instructions or a minimal proof-of-concept repository.
3. Potential attack vector and impact assessment.

### Response Timeframes

- **Initial acknowledgement**: Within 24 hours.
- **Triage and impact confirmation**: Within 72 hours.
- **Patch release and CVE disclosure**: Target within 7 business days depending on severity.

## Component Security Considerations

### 1. Rich Text Editor (`@innostes/ui/editor`)
`RichTextEditor` emits HTML string markup from Tiptap. To prevent Cross-Site Scripting (XSS) vulnerabilities:
- Always sanitize editor HTML output using an established sanitizer (such as `DOMPurify` on the client or `sanitize-html` on the server) before storing in databases or rendering via `dangerouslySetInnerHTML`.
- Restrict allowed HTML tags and attributes to standard rich text formatting.

### 2. File Dropzone (`@innostes/ui`)
`FileDropzone` provides client-side file selection and drag-and-drop validation (`accept`, `maxSize`).
- Client-side MIME type filtering is ergonomic and cannot prevent malicious payloads.
- Always validate magic bytes, file extensions, and file contents server-side upon upload before processing or storage.
- Store user-uploaded files in isolated object storage with random UUID keys rather than preserving original filenames.

## Dependency Management

All transitive dependencies are scanned during continuous integration using `pnpm audit`. Direct dependencies are strictly pinned and audited for license compliance and supply chain security.
