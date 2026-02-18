"""
Data manipulation utilities.
Migrated from utils/data_manipulation.py with Streamlit dependencies removed.
"""
import numpy as np
import pandas as pd
import xml.etree.ElementTree as ET
import random
import io
import zipfile


def convert_to_minutes_and_seconds(seconds):
    """
    Convert seconds to minutes and remaining seconds.
    
    Args:
        seconds: Total seconds
        
    Returns:
        tuple: (minutes, remaining_seconds)
    """
    minutes = seconds // 60
    remaining_seconds = np.round(seconds % 60)
    return minutes, remaining_seconds


def create_event_dataframe(
    elapsed_time: float,
    team: str,
    event: str,
    cross_outcome: str = None,
    shot_outcome: str = None,
    zone: int = None
) -> pd.DataFrame:
    """
    Create a DataFrame row for a new event.
    
    This function replaces the original save_data() function that used st.session_state.
    It creates a single-row DataFrame with event data.
    
    Args:
        elapsed_time: Time elapsed in seconds
        team: Team name
        event: Event type
        cross_outcome: Cross outcome (optional)
        shot_outcome: Shot outcome (optional)
        zone: Zone number (optional)
        
    Returns:
        pd.DataFrame: Single-row DataFrame with event data
    """
    minute, second = convert_to_minutes_and_seconds(elapsed_time)
    return pd.DataFrame({
        'minute': minute,
        'second': second,
        'time_in_second': np.round(elapsed_time),
        'team': team,
        'event_type': event,
        'cross_outcome': cross_outcome,
        'shot_outcome': shot_outcome,
        'zone': zone
    }, index=[0])


def convert_to_seconds(minute, second):
    """
    Convert minutes and seconds to total seconds.
    
    Args:
        minute: Minutes
        second: Seconds
        
    Returns:
        float: Total seconds
    """
    return minute * 60 + second


def df_to_xml(df):
    """
    Convert a DataFrame to XML format compatible with LiveTagPRO.
    
    Args:
        df: DataFrame with event data
        
    Returns:
        str: XML string
    """
    # Root element
    file_element = ET.Element("file")
    
    # Comment
    file_comment = ET.Comment("Generated with LiveTagPRO format (https://livetag.pro)")
    file_element.append(file_comment)
    
    
    # SORT_INFO section
    sort_info = ET.SubElement(file_element, "SORT_INFO")
    sort_type = ET.SubElement(sort_info, "sort_type")
    sort_type.text = "sort order"
    
    # ALL_INSTANCES section
    all_instances = ET.SubElement(file_element, "ALL_INSTANCES")
    
    for idx, row in df.iterrows():
        instance = ET.SubElement(all_instances, "instance")
        
        id_element = ET.SubElement(instance, "ID")
        id_element.text = str(idx)
        
        code_element = ET.SubElement(instance, "code")
        code_element.text = row['event_type']
        
        start = convert_to_seconds(row['minute'], row['second']) - 20
        end = convert_to_seconds(row['minute'], row['second']) + 20
        
        start_element = ET.SubElement(instance, "start")
        start_element.text = str(start)
        
        end_element = ET.SubElement(instance, "end")
        end_element.text = str(end)
        
        # Adding default label
        label = ET.SubElement(instance, "label")
        group = ET.SubElement(label, "group")
        group.text = "Event"
        text = ET.SubElement(label, "text")
        text.text = row['event_type']
        
        # Optionally add more labels or other elements if needed
        if pd.notna(row['cross_outcome']):
            label_cross = ET.SubElement(instance, "label")
            group_cross = ET.SubElement(label_cross, "group")
            group_cross.text = "CrossOutcome"
            text_cross = ET.SubElement(label_cross, "text")
            text_cross.text = row['cross_outcome']
        
        if pd.notna(row['shot_outcome']):
            label_shot = ET.SubElement(instance, "label")
            group_shot = ET.SubElement(label_shot, "group")
            group_shot.text = "ShotOutcome"
            text_shot = ET.SubElement(label_shot, "text")
            text_shot.text = row['shot_outcome']
    
    # ROWS section
    rows = ET.SubElement(file_element, "ROWS")
    
    event_types = df['event_type'].unique()
    for i, event_type in enumerate(event_types, start=1):
        row = ET.SubElement(rows, "row")
        
        sort_order = ET.SubElement(row, "sort_order")
        sort_order.text = str(i)
        
        code = ET.SubElement(row, "code")
        code.text = event_type
        
        # Random RGB values
        R = ET.SubElement(row, "R")
        R.text = str(random.randint(0, 65535))
        
        G = ET.SubElement(row, "G")
        G.text = str(random.randint(0, 65535))
        
        B = ET.SubElement(row, "B")
        B.text = str(random.randint(0, 65535))
    
    # Generating the XML string
    xml_str = ET.tostring(file_element, encoding='unicode')
    return xml_str


def save_df_to_csv(df):
    """
    Convert DataFrame to CSV string.
    
    Args:
        df: DataFrame to convert
        
    Returns:
        str: CSV content as string
    """
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    return csv_buffer.getvalue()


def create_zip_file(df, file_name):
    """
    Create a ZIP file containing CSV and XML exports of the DataFrame.
    
    Args:
        df: DataFrame to export
        file_name: Base name for the files (without extension)
        
    Returns:
        io.BytesIO: BytesIO buffer containing the ZIP file
    """
    csv_content = save_df_to_csv(df)
    xml_content = df_to_xml(df)

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'a', zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr(f'{file_name}.csv', csv_content)
        zip_file.writestr(f'{file_name}_LiveTagProFormat.xml', xml_content)
    zip_buffer.seek(0)
    return zip_buffer
