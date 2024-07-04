
import pandas as pd
from st_pages import Page, show_pages, add_page_title
import streamlit as st



st.set_page_config(
    layout="wide",
)


st.title("Post Match"+"⚽")


show_pages(
    [
        Page("app.py", "Event Tagger", "🎦"),
        Page("pages/event_tagger_handcontrol.py", "Event tagger (Hand control)", "🎦"),
        Page("pages/post_match.py", "Post Match", "⚽"),
    ]
)

def generate_youtube_embed(video_id, start_time=None, end_time=None):
    # Adjust the embedded YouTube player URL with start and end time parameters
    base_url = f"https://www.youtube-nocookie.com/embed/{video_id}"
    params = []

    if start_time:
        params.append(f"start={int(start_time)}")
    if end_time:
        params.append(f"end={int(end_time)}")

    youtube_url = base_url + "?" + "&".join(params) if params else base_url

    # Embed the player using an iframe
    iframe_html = f"""
    <div style="display: flex; justify-content: center;">
        <iframe width="560" height="315" src="{youtube_url}" frameborder="0" allowfullscreen></iframe>
    </div>
    """
    st.write(iframe_html, unsafe_allow_html=True)


# Set up the Streamlit app
selectors_col, video_col = st.columns(2)

with selectors_col:
    # Input fields for YouTube URL and time interval
    url = st.text_input('Enter YouTube URL')
    video_id = url.split('v=')[-1]
    # File uploader for CSV
    uploaded_file = st.file_uploader("Choose a CSV file", type="csv")
        
    if uploaded_file:
        df = pd.read_csv(uploaded_file)
        start_column = st.selectbox('Start event column time (must be in seconds)', options=df.columns)
        st.write('Select the column indicating the end or the offset to create the interval around the start')
        end_col, offset_col = st.columns(2)
        with end_col:
            end_column = st.selectbox('End event column time', options=df.columns, index = None)
        with offset_col:
            offset = st.number_input('Offset (s)', min_value=0, value=10)
    

with video_col:
    if url :
        st.markdown('##### Complete Video')
        generate_youtube_embed(video_id)
    else:
        st.warning('Insert a valid URL')

st.divider()



if uploaded_file:
    start_time = None
    end_time = None
    df_col, player_col = st.columns(2)
    with df_col:
        st.write("CSV Data: Select a row")
        row = st.dataframe(df, use_container_width=True, on_select='rerun', selection_mode='single-row')['selection']["rows"]

        if len(row) > 0:
            if end_column:
                start_time = int(df.loc[row, start_column])
                end_time = int(df.loc[row, end_column])
                
            else:
                t = int(df.loc[row, start_column])
                start_time, end_time = t-offset, t+offset


    with player_col: 
        if video_id:
            st.markdown('##### Clip')
            generate_youtube_embed(video_id, start_time, end_time)
            
    
    