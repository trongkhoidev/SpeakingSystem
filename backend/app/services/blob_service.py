from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from datetime import datetime, timedelta
from typing import Optional
import logging
import os
from ..core.config import settings

logger = logging.getLogger(__name__)

class BlobService:
    def __init__(self):
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.container_name = settings.AUDIO_STORAGE_BUCKET
        
        if self.connection_string:
            try:
                self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
                self.container_client = self.blob_service_client.get_container_client(self.container_name)
                
                # Ensure container exists
                if not self.container_client.exists():
                    self.container_client.create_container()
            except Exception as e:
                logger.error(f"Failed to initialize Azure Blob Client: {str(e)}")
                self.blob_service_client = None
        else:
            logger.warning("AZURE_STORAGE_CONNECTION_STRING not set. Blob storage disabled.")
            self.blob_service_client = None

    def upload_audio(self, audio_data: bytes, filename: str) -> Optional[str]:
        """Uploads audio data and returns the internal blob name/identifier."""
        if not self.blob_service_client:
            return None
            
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name, 
                blob=filename
            )
            blob_client.upload_blob(audio_data, overwrite=True)
            return filename
        except Exception as e:
            logger.error(f"Failed to upload to Azure Blob: {str(e)}")
            return None

    def get_signed_url(self, blob_name: str, expiry_minutes: int = 60) -> Optional[str]:
        """Generates a SAS token for secured public access."""
        if not self.blob_service_client or not blob_name:
            return None
            
        try:
            sas_token = generate_blob_sas(
                account_name=self.blob_service_client.account_name,
                container_name=self.container_name,
                blob_name=blob_name,
                account_key=self.blob_service_client.credential.account_key,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.utcnow() + timedelta(minutes=expiry_minutes)
            )
            
            return f"https://{self.blob_service_client.account_name}.blob.core.windows.net/{self.container_name}/{blob_name}?{sas_token}"
        except Exception as e:
            logger.error(f"Failed to generate SAS token: {str(e)}")
            return None

    def delete_audio(self, blob_name: str) -> bool:
        """Deletes a blob from storage."""
        if not self.blob_service_client:
            return False
            
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name, 
                blob=blob_name
            )
            blob_client.delete_blob()
            return True
        except Exception as e:
            logger.error(f"Failed to delete blob: {str(e)}")
            return False
