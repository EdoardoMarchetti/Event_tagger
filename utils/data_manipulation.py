import zipfile
import pandas as pd
import streamlit as st
import xml.etree.ElementTree as ET
import random
import io

def convert_to_seconds(minute, second):
    return minute * 60 + second

def df_to_xml(df):
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
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    return csv_buffer.getvalue()


def create_zip_file(df, file_name):
    csv_content = save_df_to_csv(df)
    xml_content = df_to_xml(df)

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'a', zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr(f'{file_name}.csv', csv_content)
        zip_file.writestr(f'{file_name}_LiveTagProFormat.xml', xml_content)
    zip_buffer.seek(0)
    return zip_buffer