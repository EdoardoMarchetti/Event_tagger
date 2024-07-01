
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



# Set up the Streamlit app
selectors_col, video_col = st.columns(2)

with selectors_col:
    # Input fields for YouTube URL and time interval
    url = st.text_input('Enter YouTube URL')
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
        #st.video(url)
        pass
    else:
        st.warning('Insert a valid URL')



st.write("CSV Data:")
row = st.dataframe(df, use_container_width=True, on_select='rerun', selection_mode='single-row')['selection']["rows"]

st.write(row)
st.write(df.loc[row])

if len(row) > 0:
    if end_column:
        st.write(end_column)
        start_time = int(df.loc[row, start_column])
        end_time = int(df.loc[row, end_column])
        
    else:
        st.write(offset)
        t = int(df.loc[row, start_column])
        start_time, end_time = t-offset, t+offset

    st.markdown(f"{start_time}"+ f" {end_time}")
    video_id = url.split('/')[-1]
    
    placeholder = st.empty()
    placeholder.video(url, start_time=start_time, end_time=end_time, autoplay=True, muted=True)
    
    if st.button('clean'):
        placeholder.empty()
    #st.markdown(video_html, unsafe_allow_html=True)
    