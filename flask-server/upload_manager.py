import json
import io
import base64
from PyPDF2 import PdfReader, PdfWriter

class UploadManager():
    def __init__(self):
        with open("./allowed_extensions.json", "r") as f:
            self._allowed_extensions = json.load(f)

    def _allowed_file(self, filename):
        file_extension = filename.rsplit('.', 1)[1].lower()
        
        for key, _ in self._allowed_extensions.items():
            if file_extension in self._allowed_extensions[key]:
                return key, file_extension
                
        return None, None

    def upload(self, file):
        filename = file.filename
        type, file_extension = self._allowed_file(filename)
        

        if not type or not file_extension:
            return{"Status": "Error", "Message": "Invalid filetype"}, 422

        try:
            file_data = file.read()
            encoded_data = base64.b64encode(file_data).decode('utf-8')
            if type == "image":
                image_media_type = file.content_type
                return {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": image_media_type,
                        "data": encoded_data
                    }
                }
            elif type == "document":
                pdf_reader = PdfReader(io.BytesIO(file_data))
                num_pages = len(pdf_reader.pages)
                
                if num_pages > 100:
                    pdf_writer = PdfWriter()
                    
                    for page in range(100):
                        pdf_writer.add_page(pdf_reader.pages[page])
                        
                    output_bytes = io.BytesIO()
                    pdf_writer.write(output_bytes)
                    output_bytes.seek(0)
                    encoded_data = base64.b64encode(output_bytes.getvalue()).decode('utf-8')
                
                return {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": encoded_data
                    }
                }
            else:
                return {
                    "type": "text",
                    "text": file_data.decode('utf-8')
                }
        except Exception as e:
            return {"Status": "Error", "Message": str(e)}, 422