from collections import defaultdict
import numpy as np
import pandas as pd
import streamlit as st
import threading
import time

#Streamlit
from streamlit.runtime.scriptrunner.script_run_context import get_script_run_ctx,add_script_run_ctx
from st_pages import Page, Section, show_pages, add_page_title
#Viz
import altair as alt

st.set_page_config(
    page_title='Main'
)


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
            'shot_outcome':st.session_state.shot_outcome
        }, index = [0])
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

st.title('Event Tagger')
show_pages(
    [
        Page("app.py", "Event Tagger", "🎦"),
        Page("pages/post_match.py", "Post Match", "⚽"),
    ]
)

#-------------------------------------
#--------------MAIN PAGE--------------
#-------------------------------------
global start_time
start_time = None

st.markdown('## Start the stopwatch')

running_text = st.empty()


# Create a button to start/stop the stopwatch
if st.button("Start / Stop"):
    #If the start event is set => Clear it and stop the timer
    if st.session_state.start_event.is_set():
        st.session_state.start_event.clear()
        st.session_state.stop_event.set()  # Signal the existing thread to stop
        #Clear the df
        st.session_state.data = empty_df.copy()
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
st.markdown('## Event description')


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
    st.session_state.cross_outcome = st.radio(label='Cross?',
            horizontal=True,
            options=['None','Completed', 'Blocked', 'Intercepted', 'Saved'],
            )
#is Shot 
with shot_col:
    # Enable shot_outcome options only if cross_outcome is 'None' or 'Completed'
    if st.session_state.cross_outcome in ['None', 'Completed']:
        st.session_state.shot_outcome = st.radio(label='Shot_outcome',
                                                 horizontal=True,
                                                 options=['None', 'Goal', 'Post', 'Blocked', 'Out', 'Saved'])
    else:
        # If cross_outcome is not 'None' or 'Completed', disable shot_outcome options
        st.session_state.shot_outcome = st.radio(label='Shot_outcome',
                                                     options=['None'],
                                                     disabled=True)

    

if 'data' not in st.session_state:
    st.session_state.data = empty_df.copy()

#Save button
st.button("Save", on_click=save_data)


#--------------DATA--------------
st.write('-------------------------')
st.markdown('## Collected events')
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

#Data manipulation
df = st.session_state.data.copy()

stats = defaultdict(dict)
for team in df.team.unique():
    team_df = df.loc[df.team == team, :]
    stats[team] = {
        'Goal' : team_df['shot_outcome'].isin(['Goal']).sum(),
        'Shots' : (~team_df['shot_outcome'].isna()).sum(),
        'SoT' : team_df['shot_outcome'].isin(['Goal', 'Save', 'Post']).sum(),
        'CrossAtt' : (~team_df['cross_outcome'].isna()).sum(),
        'CrossCmpl' : (len(team_df[team_df.cross_outcome == 'Completed'])),
        'Transitions' : (len(team_df[team_df.event_type == 'Transition']))
    }

df = pd.DataFrame(stats).T.reset_index(names=['team'])
df = df.melt(id_vars=['team'])

df = pd.merge(df, df.groupby(by='variable')['value'].sum(), on='variable')
df.rename(columns={'value_x':'value', 'value_y':'total'}, inplace=True)
df['fraction'] = df['value']/df['total']

divergent_barc_chart = make_divergent_chart(df)

st.altair_chart(divergent_barc_chart, theme=None, use_container_width=True)
 
    
