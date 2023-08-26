import numpy as np
import pandas as pd
import streamlit as st
import threading
import time
from streamlit.runtime.scriptrunner.script_run_context import get_script_run_ctx,add_script_run_ctx


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

    if 'event' not in st.session_state:
        st.session_state.event = None

    if 'team' not in st.session_state:
        st.session_state.team = None

#-------------------------------------
#--------------FUNCTIONS--------------
#-------------------------------------

def save_data():
    if st.session_state.running:
        minute, second = convert_to_minutes_and_seconds(st.session_state.elapsed_time)
        temp = pd.DataFrame({
            'minute':minute,
            'second': second,
            'team': st.session_state.team,
            'event_type':st.session_state.event
        }, index = [0])
        st.session_state.data = pd.concat([st.session_state.data,temp], ignore_index = True)

@st.cache
def convert_df(df):
    return df.to_csv().encode('utf-8')

init_session_state()


st.title("Stopwatch App")


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

        
st.write('-------------------------')
st.title('Event description')
col1,col2  = st.columns([1,3])

with col1:
    st.session_state.team = st.radio(label='Select team',
            options=['Home', 'Away'])
    
with col2:
    st.session_state.event = st.radio(label='Select event',
             horizontal=True,
             options=['Shot', 'Goal', 'Cross',
                      'Attack', 'Corner', 'Dead-ball',
                      'prova1', 'prova2', 'prova'])
    
st.write('---------------------------')
if 'data' not in st.session_state:
    st.session_state.data = pd.DataFrame({'minute':[], 'second':[], 'team':[], 'event_type':[]})

print(st.session_state.data)


#Init the save button
def convert_to_minutes_and_seconds(seconds):
    minutes = seconds // 60
    remaining_seconds = np.round(seconds % 60)
    return minutes, remaining_seconds





st.button("Save", on_click=save_data)

st.dataframe(st.session_state.data)


csv = convert_df(st.session_state.data)

st.download_button(
    "Press to Download",
    csv,
    "prova.csv",
    "text/csv",
)
 
    
