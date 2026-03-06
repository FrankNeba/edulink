"""
core/supabase_storage.py
========================
A Django Storage backend that uploads files to a Supabase Storage bucket
and returns the public URL as the stored name.

Files are organised by their upload_to path, exactly as they would be
locally.  The public URL is persisted in the database so the app never
needs the local filesystem for uploaded files.

Usage in models
---------------
    from django.db import models
    from core.supabase_storage import SupabaseStorage

    class Note(models.Model):
        file = models.FileField(upload_to='notes/pdf/', storage=SupabaseStorage())

Or set DEFAULT_FILE_STORAGE in settings.py to use it everywhere:
    DEFAULT_FILE_STORAGE = 'core.supabase_storage.SupabaseStorage'
"""

import os
import mimetypes
import urllib.parse
from io import BytesIO

from django.core.files.storage import Storage
from django.conf import settings
from django.utils.deconstruct import deconstructible


def _get_client():
    """Return an authenticated Supabase client (lazy, cached per process)."""
    from supabase import create_client
    url = os.environ.get('SUPABASE_URL') or getattr(settings, 'SUPABASE_URL', '')
    key = os.environ.get('SUPABASE_SERVICE_KEY') or getattr(settings, 'SUPABASE_SERVICE_KEY', '')
    if not url or not key:
        raise RuntimeError(
            'SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment / settings.'
        )
    return create_client(url, key)


def _bucket():
    return os.environ.get('SUPABASE_BUCKET') or getattr(settings, 'SUPABASE_BUCKET', 'files')


@deconstructible
class SupabaseStorage(Storage):
    """
    Custom Django Storage backend backed by Supabase Storage.

    • _save()   → uploads to Supabase, returns the public URL
    • url()     → returns the stored value (already a full URL)
    • exists()  → checks Supabase for the object
    • delete()  → removes from Supabase
    • _open()   → downloads from Supabase into a BytesIO buffer
    """

    def __init__(self, bucket=None):
        self._bucket_name = bucket  # None → read from env at runtime

    @property
    def bucket(self):
        return self._bucket_name or _bucket()

    # ------------------------------------------------------------------ #
    # Required overrides                                                   #
    # ------------------------------------------------------------------ #

    def _open(self, name, mode='rb'):
        """Download a file from Supabase and return it as a File object."""
        from django.core.files.base import ContentFile
        client = _get_client()
        # name may be a full public URL – strip to path if so
        path = self._to_path(name)
        data = client.storage.from_(self.bucket).download(path)
        return ContentFile(data, name=os.path.basename(path))

    def _save(self, name, content):
        """
        Upload `content` to Supabase under `name` (the upload_to path).
        Returns the **public URL** so it is stored in the DB.
        """
        client = _get_client()
        bucket_name = self.bucket

        # Read file bytes
        if hasattr(content, 'read'):
            file_bytes = content.read()
        else:
            file_bytes = bytes(content)

        # Guess MIME type
        mime_type, _ = mimetypes.guess_type(name)
        mime_type = mime_type or 'application/octet-stream'

        # Sanitise the path (no leading slash)
        path = name.lstrip('/')

        # Upsert so re-uploads don't fail
        client.storage.from_(bucket_name).upload(
            path=path,
            file=file_bytes,
            file_options={
                'content-type': mime_type,
                'upsert': 'true',
            },
        )

        # Build and return the public URL
        public_url = self._build_public_url(path)
        return public_url

    def exists(self, name):
        """Return True if the object exists in the bucket."""
        try:
            client = _get_client()
            path = self._to_path(name)
            # list() with prefix is the most reliable way to check existence
            folder = os.path.dirname(path)
            filename = os.path.basename(path)
            items = client.storage.from_(self.bucket).list(folder)
            return any(item.get('name') == filename for item in (items or []))
        except Exception:
            return False

    def url(self, name):
        """The `name` stored in DB is already the public URL."""
        if name and name.startswith('http'):
            return name
        # Fallback: build from path
        return self._build_public_url(name.lstrip('/'))

    def delete(self, name):
        """Remove a file from Supabase."""
        try:
            client = _get_client()
            path = self._to_path(name)
            client.storage.from_(self.bucket).remove([path])
        except Exception as e:
            print(f'[SupabaseStorage] delete failed for {name}: {e}')

    def size(self, name):
        """Return file size in bytes (not guaranteed by all Supabase configs)."""
        try:
            client = _get_client()
            path = self._to_path(name)
            folder = os.path.dirname(path)
            filename = os.path.basename(path)
            items = client.storage.from_(self.bucket).list(folder)
            for item in (items or []):
                if item.get('name') == filename:
                    return item.get('metadata', {}).get('size', 0)
        except Exception:
            pass
        return 0

    def listdir(self, path):
        """List directories and files at `path` in the bucket."""
        client = _get_client()
        items = client.storage.from_(self.bucket).list(path.lstrip('/')) or []
        dirs = [i['name'] for i in items if i.get('id') is None]
        files = [i['name'] for i in items if i.get('id') is not None]
        return dirs, files

    # ------------------------------------------------------------------ #
    # Helpers                                                              #
    # ------------------------------------------------------------------ #

    def _build_public_url(self, path):
        supabase_url = (
            os.environ.get('SUPABASE_URL')
            or getattr(settings, 'SUPABASE_URL', '')
        ).rstrip('/')
        bucket = self.bucket
        # Encode only the path segments, not slashes
        encoded = '/'.join(urllib.parse.quote(seg, safe='') for seg in path.split('/'))
        return f'{supabase_url}/storage/v1/object/public/{bucket}/{encoded}'

    def _to_path(self, name):
        """Convert a DB value (full URL or relative path) to a bucket-relative path."""
        if name and name.startswith('http'):
            # Extract the path after /public/<bucket>/
            marker = f'/public/{self.bucket}/'
            idx = name.find(marker)
            if idx != -1:
                return urllib.parse.unquote(name[idx + len(marker):])
            # Fallback: everything after the last known segment
            parsed = urllib.parse.urlparse(name)
            return urllib.parse.unquote(parsed.path.lstrip('/'))
        return name.lstrip('/')
