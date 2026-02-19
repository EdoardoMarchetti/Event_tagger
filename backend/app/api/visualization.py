"""
API endpoints for visualization generation.
"""
from fastapi import APIRouter, Header, HTTPException
from typing import Dict, Any, Optional
import pandas as pd

from app.services.event_service import (
    get_events_dataframe,
    get_hot_zone
)
from app.utils.data_viz import plot_pitch, plot_pitch_areas, create_grid
from app.utils.divergent_chart import make_divergent_chart_plotly


router = APIRouter()


def _prepare_stats_dataframe(session_id: str) -> pd.DataFrame:
    """
    Prepare statistics DataFrame for divergent chart.
    
    Args:
        session_id: Session identifier
        
    Returns:
        pd.DataFrame: DataFrame with team, variable, value, fraction columns
    """
    df = get_events_dataframe(session_id)
    
    if df.empty:
        return pd.DataFrame(columns=['team', 'variable', 'value', 'fraction'])
    
    # Calculate stats per team
    stats = {}
    for team in df['team'].unique():
        team_df = df.loc[df['team'] == team, :]
        stats[team] = {
            'Goal': team_df['shot_outcome'].isin(['Goal']).sum(),
            'Shots': len(team_df.loc[team_df['shot_outcome'] != 'None']),
            'SoT': team_df['shot_outcome'].isin(['Goal', 'Save', 'Post']).sum(),
            'CrossAtt': len(team_df.loc[team_df['cross_outcome'] != 'None']),
            'CrossCmpl': len(team_df[team_df['cross_outcome'] == 'Completed']),
            'Transitions': len(team_df[team_df['event_type'] == 'Transition'])
        }
    
    # Convert to DataFrame
    stats_df = pd.DataFrame(stats).T.reset_index(names=['team'])
    stats_df = stats_df.melt(id_vars=['team'], var_name='variable', value_name='value')
    
    # Calculate fractions
    total_by_variable = stats_df.groupby('variable')['value'].sum()
    stats_df = stats_df.merge(
        total_by_variable.rename('total'),
        left_on='variable',
        right_index=True
    )
    stats_df['fraction'] = stats_df['value'] / stats_df['total']
    stats_df = stats_df.drop(columns=['total'])
    
    return stats_df


@router.post("/divergent-chart")
async def generate_divergent_chart(
    session_id: str = Header(..., alias="X-Session-ID")
) -> Dict[str, Any]:
    """
    Generate divergent bar chart comparing teams.
    
    Args:
        session_id: Session identifier from header
        
    Returns:
        dict: Plotly figure dictionary (JSON-serializable)
    """
    df = _prepare_stats_dataframe(session_id)
    
    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="No events found for this session"
        )
    
    chart_dict = make_divergent_chart_plotly(df)
    return chart_dict


@router.post("/heatmap")
async def generate_heatmap(
    rows: int = 3,
    columns: int = 3,
    field_length: float = 120,
    field_width: float = 80,
    event_type: Optional[str] = None,
    session_id: str = Header(..., alias="X-Session-ID")
) -> Dict[str, Any]:
    """
    Generate heatmap visualization of events on pitch.
    
    Args:
        rows: Number of rows in the grid
        columns: Number of columns in the grid
        field_length: Field length in meters
        field_width: Field width in meters
        event_type: Optional event type filter (e.g., 'Transition', 'Corner', etc.)
        session_id: Session identifier from header
        
    Returns:
        dict: Plotly figure dictionary (JSON-serializable)
    """
    try:
        field_dimen = (field_length, field_width)
        
        # Get hot zone data, optionally filtered by event type
        hot_zone = get_hot_zone(session_id, event_type=event_type)
        
        if not hot_zone:
            raise HTTPException(
                status_code=400,
                detail="No zone data found for this session"
            )
        
        # Create pitch with areas
        fig, zone_dict = plot_pitch_areas(
            n_rows=rows,
            n_cols=columns,
            field_dimen=field_dimen,
            show_numbers=False
        )
        
        # Create heatmap grid
        fig = create_grid(
            cell_centers=zone_dict,
            hot_dict=hot_zone,
            rows=rows,
            columns=columns,
            field_dimen=field_dimen,
            fig=fig
        )
        
        return fig.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Error generating heatmap: {str(e)}\n{traceback.format_exc()}"
        print(f"[ERROR] {error_detail}")  # Log for debugging
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/pitch")
async def get_pitch_data(
    rows: int = 3,
    columns: int = 3,
    field_length: float = 120,
    field_width: float = 80,
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
) -> Dict[str, Any]:
    """
    Get pitch visualization data for rendering.
    
    Args:
        rows: Number of rows in the grid
        columns: Number of columns in the grid
        field_length: Field length in meters
        field_width: Field width in meters
        session_id: Optional session identifier from header
        
    Returns:
        dict: Pitch figure dictionary with zone information
    """
    field_dimen = (field_length, field_width)
    
    # Create pitch with areas
    fig, zone_dict = plot_pitch_areas(
        n_rows=rows,
        n_cols=columns,
        field_dimen=field_dimen
    )
    
    # Get hot zone if session_id provided
    hot_zone = {}
    if session_id:
        hot_zone = get_hot_zone(session_id)
    
    return {
        "figure": fig.to_dict(),
        "zone_dict": {str(k): list(v) for k, v in zone_dict.items()},
        "hot_zone": {str(k): v for k, v in hot_zone.items()},
        "rows": rows,
        "columns": columns,
        "field_dimen": list(field_dimen)
    }
