export class FileUploadService {
  constructor() {
    this.uploadedFiles = [];
  }

  handleFileUpload(event, uploadedFilesContainer) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      if (!this.uploadedFiles.some(f => f.name === file.name)) {
        this.uploadedFiles.push(file);
        this.renderUploadedFiles(uploadedFilesContainer);
      }
    });
  }

  renderUploadedFiles(uploadedFilesContainer) {
    uploadedFilesContainer.innerHTML = '';
    this.uploadedFiles.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.classList.add('uploaded-file-item');
      
      // File type icon
      const fileTypeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      fileTypeIcon.setAttribute('viewBox', '0 0 24 24');
      fileTypeIcon.innerHTML = `<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" fill="#3498db"/>`;
      
      const fileName = document.createElement('span');
      fileName.classList.add('file-name');
      fileName.textContent = file.name;
      
      const removeButton = document.createElement('span');
      removeButton.classList.add('remove-file');
      removeButton.textContent = '✖';
      removeButton.addEventListener('click', () => {
        this.uploadedFiles.splice(index, 1);
        this.renderUploadedFiles(uploadedFilesContainer);
      });

      fileItem.appendChild(fileTypeIcon);
      fileItem.appendChild(fileName);
      fileItem.appendChild(removeButton);
      
      uploadedFilesContainer.appendChild(fileItem);
    });
  }
}