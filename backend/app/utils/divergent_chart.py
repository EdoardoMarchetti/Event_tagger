"""
Divergent chart generation using Plotly.
Converts Altair divergent chart to Plotly format.
"""
import pandas as pd
import plotly.graph_objects as go
from typing import Dict, Any


def make_divergent_chart_plotly(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Create a divergent bar chart using Plotly.
    
    This function replicates the Altair divergent chart from the original Streamlit app.
    
    Args:
        df: DataFrame with columns: team, variable, value, fraction
        
    Returns:
        dict: Plotly figure dictionary that can be serialized to JSON
    """
    # Separate data by team
    home_df = df[df['team'] == 'Home'].copy()
    away_df = df[df['team'] == 'Away'].copy()
    
    # Get unique variables/metrics
    variables = df['variable'].unique()
    
    # Create figure
    fig = go.Figure()
    
    # Colors
    home_color = '#1f77b4'
    away_color = '#e377c2'
    
    # Add Home bars (left side, negative)
    if not home_df.empty:
        home_values = []
        home_texts = []
        for var in variables:
            var_data = home_df[home_df['variable'] == var]
            if not var_data.empty:
                home_values.append(-var_data['fraction'].sum())
                home_texts.append(str(int(var_data['value'].sum())))
            else:
                home_values.append(0)
                home_texts.append('0')
        
        fig.add_trace(go.Bar(
            y=variables,
            x=home_values,
            name='Home',
            orientation='h',
            marker=dict(color=home_color),
            text=home_texts,
            textposition='outside',
            textfont=dict(color='white'),
            hovertemplate='Home<br>%{y}<br>%{text}<extra></extra>'
        ))
    
    # Add Away bars (right side, positive)
    if not away_df.empty:
        away_values = []
        away_texts = []
        for var in variables:
            var_data = away_df[away_df['variable'] == var]
            if not var_data.empty:
                away_values.append(var_data['fraction'].sum())
                away_texts.append(str(int(var_data['value'].sum())))
            else:
                away_values.append(0)
                away_texts.append('0')
        
        fig.add_trace(go.Bar(
            y=variables,
            x=away_values,
            name='Away',
            orientation='h',
            marker=dict(color=away_color),
            text=away_texts,
            textposition='outside',
            textfont=dict(color='white'),
            hovertemplate='Away<br>%{y}<br>%{text}<extra></extra>'
        ))
    
    # Update layout
    fig.update_layout(
        xaxis=dict(
            range=[-1, 1],
            showgrid=False,
            zeroline=True,
            zerolinecolor='white',
            showticklabels=False
        ),
        yaxis=dict(
            showgrid=False,
            showticklabels=True,
            tickfont=dict(color='white')
        ),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
        barmode='overlay',
        showlegend=False,
        height=400,
        margin=dict(l=100, r=100, t=50, b=50)
    )
    
    # Return as dictionary for JSON serialization
    return fig.to_dict()
