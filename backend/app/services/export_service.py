"""
Business logic for data export.
"""
import pandas as pd
from typing import Optional
import io

from app.utils.data_manipulation import df_to_xml, save_df_to_csv, create_zip_file


def export_to_csv(df: pd.DataFrame) -> str:
    """
    Export DataFrame to CSV string.
    
    Args:
        df: DataFrame to export
        
    Returns:
        str: CSV content as string
    """
    return save_df_to_csv(df)


def export_to_xml(df: pd.DataFrame) -> str:
    """
    Export DataFrame to XML string (LiveTagPRO format).
    
    Args:
        df: DataFrame to export
        
    Returns:
        str: XML content as string
    """
    return df_to_xml(df)


def export_to_zip(df: pd.DataFrame, file_name: str) -> io.BytesIO:
    """
    Export DataFrame to ZIP file containing CSV and XML.
    
    Args:
        df: DataFrame to export
        file_name: Base name for files (without extension)
        
    Returns:
        io.BytesIO: ZIP file as BytesIO buffer
    """
    return create_zip_file(df, file_name)
