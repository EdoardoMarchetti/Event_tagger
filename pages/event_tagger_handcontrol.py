from collections import defaultdict
import numpy as np
import pandas as pd
import streamlit as st
import threading
import time
from PIL import Image
import base64

#Streamlit
from streamlit.runtime.scriptrunner.script_run_context import get_script_run_ctx,add_script_run_ctx
from st_pages import Page, Section, show_pages, add_page_title
from streamlit_extras.stylable_container import stylable_container
#Viz
import altair as alt
from utils.data_viz import *

st.set_page_config(
    page_title='Main',
    layout="wide"
)




#Variables
empty_df = pd.DataFrame({'minute':[], 'second':[], 
                        'team':[],
                        'event_type':[],
                        'cross_outcome':[],
                        'shot_outcome':[],
                        'zone':[]
                                          })


#-------------------------------------
#--------------FUNCTIONS--------------
#-------------------------------------

#Stopwatch thread
def stopwatch_thread(stop_event, start_event):
    global start_time
    while not stop_event.is_set():
        if start_event.is_set():
            st.session_state.elapsed_time = time.time() - start_time
        time.sleep(0.5)  # Update every second

#Init the session state
def init_session_state():
    if 'stop_event' not in st.session_state:
        st.session_state.stop_event = threading.Event()

    if 'start_event' not in st.session_state:
        st.session_state.start_event = threading.Event()

    if 'elapsed_time' not in st.session_state:
        st.session_state.elapsed_time = 0

    if 'running' not in st.session_state:
        st.session_state.running = False
    
    if 'team' not in st.session_state:
        st.session_state.team = None

    if 'event' not in st.session_state:
        st.session_state.event = None

    if 'cross_outcome' not in st.session_state:
        st.session_state.cross_outcome = None

    if 'shot_outcome' not in st.session_state:
        st.session_state.shot_outcome = None

    if 'basic_tags' not in st.session_state:
        st.session_state.basic_tags = set(
            ['Transition', 'Corner', 'Dead-ball', 'Slow-attck', 'Penalty'])
    
    if 'zone' not in st.session_state:
        st.session_state.zone = 0

    if 'hot_zone' not in st.session_state:
        st.session_state.hot_zone = defaultdict(lambda: 0)

#Save the data
def save_data():
    if st.session_state.running:
        minute, second = convert_to_minutes_and_seconds(st.session_state.elapsed_time)
        temp = pd.DataFrame({
            'minute':minute,
            'second': second,
            'team': st.session_state.team,
            'event_type':st.session_state.event,
            'cross_outcome':st.session_state.cross_outcome,
            'shot_outcome':st.session_state.shot_outcome,
            'zone': st.session_state.zone
        }, index = [0])
        
        if st.session_state.zone is not None:
            st.session_state.hot_zone[st.session_state.zone] += 1
        st.session_state.data = pd.concat([st.session_state.data,temp], ignore_index = True)


#Create the divergent bar chart
def make_divergent_chart(df):

    base = alt.Chart(df)


    color_scale = alt.Scale(domain=['Home', 'Away'],
                            range=['#1f77b4', '#e377c2'])
    
    #Home side
    left_base = base.transform_filter(
        alt.datum.team == 'Home'
    ).encode(
        alt.Y('variable:N').axis(None),
        alt.X('sum(fraction):Q',
          scale=alt.Scale(domain=(0, 1)),
          title='',
          sort='descending',
          axis=None),
        alt.Color('team:N')
            .scale(color_scale)
            .legend(None),
        text='sum(value):Q'
    )

    left = left_base.mark_bar() + left_base.mark_text(align='right', dx = -2, color='white')
    left = left.properties(title='Home')

    #Metrics
    middle = base.encode(
        alt.Y('variable:N').axis(None),
        alt.Text('variable:N'),
    ).mark_text(color='white').properties(width=20)

    #Away
    right_base = base.transform_filter(
        alt.datum.team == 'Away'
    ).encode(
        alt.Y('variable:N').axis(None),
        alt.X('sum(fraction):Q',
          scale=alt.Scale(domain=(0, 1)),
          title='',
          axis=None),
        alt.Color('team:N').scale(color_scale).legend(None),
        text='sum(value):Q'
    ).mark_bar().properties(title='Away')

    right = right_base.mark_bar() + right_base.mark_text(align='left', dx = 2, color='white')
    right = right.properties(title='Away')

    chart = alt.concat(left, middle, right, spacing=5)
    chart = chart.configure_axis(grid=False).configure_view(strokeWidth=0)
    return chart 


@st.cache_data
def convert_df(df):
    return df.to_csv(index=False).encode('utf-8') 

def convert_to_minutes_and_seconds(seconds):
    minutes = seconds // 60
    remaining_seconds = np.round(seconds % 60)
    return minutes, remaining_seconds     



init_session_state()

#------------------------------------
#------------SIDEBAR-----------------
#------------------------------------

st.title('Event Tagger Hand Control')
show_pages(
    [
        Page("app.py", "Event Tagger", "🎦"),
        Page("pages/event_tagger_handcontrol.py", "Event tagger (Hand control)", "🎦"),
        Page("pages/post_match.py", "Post Match", "⚽"),
    ]
)

#-------------------------------------
#--------------MAIN PAGE--------------
#-------------------------------------
global start_time
start_time = None

st.markdown('## Start the stopwatch')
st.markdown('Click on start / stop button when the match starts to sync events timenstamp with recording')


running_text = st.empty()


# Create a button to start/stop the stopwatch
if st.button("Start / Stop"):
    #If the start event is set => Clear it and stop the timer
    if st.session_state.start_event.is_set():
        st.session_state.start_event.clear()
        st.session_state.stop_event.set()  # Signal the existing thread to stop
        #Clear the df
        st.session_state.data = empty_df.copy()
        st.session_state.hot_zone = {}
    else:
        #If the start event is not set then star the timer
        st.session_state.start_event.set()
        st.session_state.stop_event.clear()  # Clear the stop_event
        #Get the starting time
        start_time = time.time()
        #Create the thread
        thread = threading.Thread(target=stopwatch_thread, args=(st.session_state.stop_event, st.session_state.start_event))
        thread.daemon = True
        add_script_run_ctx(thread)
        thread.start()
    #Update running state
    st.session_state.running = not st.session_state.running
    



#Plot the timer status
with running_text:
    if st.session_state.running:
        st.write('Running')
        st.warning('BEFORE STOP SAVE THE DATA. WHEN YOU STOP YOU DELETE THE DATA')
    else:
        st.write('Stopped')


#--------------EVENT DESCRIPTION----------------
st.write('-------------------------')
st.markdown('## Event description')

#Tag configuration

text = st.text_input(label='**Add a Tag** : Add custom events such as Build up or Defending situation')

if text != '':
    st.session_state.basic_tags.add(text)
#Tag selection
selected_tags = st.multiselect('Tags', 
            default=st.session_state.basic_tags, 
            options=st.session_state.basic_tags)

n_cols = int(np.ceil(np.sqrt(len(selected_tags))))
n_rows = (len(selected_tags) // n_cols) + 1 

button_cols = st.columns(n_cols)


selected_tags = np.array(selected_tags)


def print_tag(tag):
    st.session_state.event = tag
    save_data()
    pass

for i,tag in enumerate(selected_tags):
    with button_cols[i%n_cols]:
        st.button(label=tag, on_click=print_tag, args=[tag])

        

#--------------DATA--------------
st.write('-------------------------')
st.markdown('## Collected events')
st.dataframe(st.session_state.data, use_container_width=True)

csv = convert_df(st.session_state.data)

text = st.text_input(label='Define filename')
#Downloading button
st.download_button(
    "Press to Download",
    csv,
    text+'.csv',
    "text/csv", 
)


#--------------VISUALIZATION--------------
st.write('-------------------------')

#Data manipulation
df = st.session_state.data.copy()

stats = defaultdict(dict)
for team in df.team.unique():
    team_df = df.loc[df.team == team, :]
    stats[team] = {
        'Goal' : team_df['shot_outcome'].isin(['Goal']).sum(),
        'Shots' : len(team_df.loc[team_df['shot_outcome']!='None']),
        'SoT' : team_df['shot_outcome'].isin(['Goal', 'Save', 'Post']).sum(),
        'CrossAtt' : len(team_df.loc[team_df['cross_outcome']!='None']),
        'CrossCmpl' : (len(team_df[team_df.cross_outcome == 'Completed'])),
        'Transitions' : (len(team_df[team_df.event_type == 'Transition']))
    }



df = pd.DataFrame(stats).T.reset_index(names=['team'])
df = df.melt(id_vars=['team'])



df = pd.merge(df, df.groupby(by='variable')['value'].sum(), on='variable')
df.rename(columns={'value_x':'value', 'value_y':'total'}, inplace=True)
df['fraction'] = df['value']/df['total']

divergent_barc_chart = make_divergent_chart(df)


        
 
    
