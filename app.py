import numpy as np
import pandas as pd
import streamlit as st
import threading
import time
from streamlit.runtime.scriptrunner.script_run_context import get_script_run_ctx,add_script_run_ctx

import altair as alt

#Variables
empty_df = pd.DataFrame({'minute':[], 'second':[], 
                                          'team':[],
                                          'event_type':[],
                                          'cross_outcome':[],
                                          'shot_outcome':[],
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


def save_data():
    if st.session_state.running:
        minute, second = convert_to_minutes_and_seconds(st.session_state.elapsed_time)
        temp = pd.DataFrame({
            'minute':minute,
            'second': second,
            'team': st.session_state.team,
            'event_type':st.session_state.event,
            'cross_outcome':st.session_state.cross_outcome,
            'shot_outcome':st.session_state.shot_outcome
        }, index = [0])
        st.session_state.data = pd.concat([st.session_state.data,temp], ignore_index = True)

@st.cache_data
def convert_df(df):
    return df.to_csv().encode('utf-8') 

def convert_to_minutes_and_seconds(seconds):
    minutes = seconds // 60
    remaining_seconds = np.round(seconds % 60)
    return minutes, remaining_seconds     



init_session_state()

#------------------------------------
#------------SIDEBAR-----------------
#------------------------------------

#TODO

#-------------------------------------
#--------------MAIN PAGE--------------
#-------------------------------------

st.title("Event Tagger")


global start_time
start_time = None

running_text = st.empty()


# Create a button to start/stop the stopwatch
if st.button("Start / Stop"):
    #If the start event is set => Clear it and stop the timer
    if st.session_state.start_event.is_set():
        st.session_state.start_event.clear()
        st.session_state.stop_event.set()  # Signal the existing thread to stop
        #Clear the df
        st.session_state.data = pd.DataFrame({'minute':[], 'second':[], 'team':[], 'event_type':[]})
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
    else:
        st.write('Stopped')


#--------------EVENT DESCRIPTION----------------
st.write('-------------------------')
st.title('Event description')

#Tag configuration
text = st.text_input(label='Add a Tag')
if text != '':
    st.session_state.basic_tags.add(text)

#Tag selection
selected_tags = st.multiselect('Tags', 
            default=st.session_state.basic_tags, 
            options=st.session_state.basic_tags)

#Team radio menu
st.session_state.team = st.radio(label='Select team',
            horizontal=True,
            options=['Home', 'Away'])

#Event Description radio menus
event_type_col,cross_col,shot_col = st.columns(3)

#Event type
with event_type_col:
    st.session_state.event = st.radio(label='Select event',
             horizontal=True,
             options=selected_tags)
#is Cross 
with cross_col:
    st.session_state.team = st.radio(label='Cross?',
            horizontal=True,
            options=['Nan','Completed', 'Blocked', 'Intercepted', 'Saved'],
            )
#is Shot 
with shot_col:
    st.session_state.team = st.radio(label='Shot_outcome',
            horizontal=True,
            options=['Nan', 'Goal', 'Post', 'Blocked', 'Out', 'Saved'])

    

if 'data' not in st.session_state:
    st.session_state.data = empty_df.copy()

#Save button
st.button("Save", on_click=save_data)


#--------------DATA--------------
st.write('-------------------------')
st.title('Collected events')
st.dataframe(st.session_state.data)

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

base = alt.Chart(st.session_state.data).mark_bar().encode(
    x='count(event_type):Q',
    y=alt.Y('team:N'),
    color=alt.Color('team:N'),
    row='event_type'
)

st.altair_chart(base, theme=None)
 
    
