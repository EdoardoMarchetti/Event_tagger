import numpy as np
import pandas as pd
import streamlit as st

def convert_to_minutes_and_seconds(seconds):
    minutes = seconds // 60
    remaining_seconds = np.round(seconds % 60)
    return minutes, remaining_seconds 

def save_data():
    if st.session_state.running:
        minute, second = convert_to_minutes_and_seconds(st.session_state.elapsed_time)
        temp = pd.DataFrame({
            'minute':minute,
            'second': second,
            'time_in_second': np.round(st.session_state.elapsed_time),
            'team': st.session_state.team,
            'event_type':st.session_state.event,
            'cross_outcome':st.session_state.cross_outcome,
            'shot_outcome':st.session_state.shot_outcome,
            'zone': st.session_state.zone
        }, index = [0])
        
        if st.session_state.zone is not None:
            st.session_state.hot_zone[st.session_state.zone] += 1
        st.session_state.data = pd.concat([st.session_state.data,temp], ignore_index = True)