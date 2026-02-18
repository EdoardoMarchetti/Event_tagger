"""
API endpoints for data export.
"""
from fastapi import APIRouter, Header, Response, HTTPException, Query
from typing import Optional
import pandas as pd

from app.services.event_service import get_events_dataframe
from app.services.export_service import (
    export_to_csv,
    export_to_xml,
    export_to_zip
)

router = APIRouter()


@router.post("/csv")
async def export_csv(
    session_id: str = Header(..., alias="X-Session-ID"),
    filename: Optional[str] = Query(None, description="Optional filename for download")
):
    """
    Export events as CSV.
    
    Args:
        session_id: Session identifier from header
        filename: Optional filename for download
        
    Returns:
        Response: CSV file response
    """
    df = get_events_dataframe(session_id)
    
    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="No events found for this session"
        )
    
    csv_content = export_to_csv(df)
    filename = filename or "events.csv"
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.post("/xml")
async def export_xml(
    session_id: str = Header(..., alias="X-Session-ID"),
    filename: Optional[str] = None
):
    """
    Export events as XML (LiveTagPRO format).
    
    Args:
        session_id: Session identifier from header
        filename: Optional filename for download
        
    Returns:
        Response: XML file response
    """
    df = get_events_dataframe(session_id)
    
    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="No events found for this session"
        )
    
    xml_content = export_to_xml(df)
    filename = filename or "events_LiveTagProFormat.xml"
    
    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.post("/zip")
async def export_zip(
    session_id: str = Header(..., alias="X-Session-ID"),
    filename: Optional[str] = Query(None, description="Optional base filename (without extension)")
):
    """
    Export events as ZIP file containing CSV and XML.
    
    Args:
        session_id: Session identifier from header
        filename: Optional base filename (without extension)
        
    Returns:
        Response: ZIP file response
    """
    df = get_events_dataframe(session_id)
    
    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="No events found for this session"
        )
    
    file_name = filename or "events"
    zip_buffer = export_to_zip(df, file_name)
    
    return Response(
        content=zip_buffer.read(),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{file_name}.zip"'
        }
    )
