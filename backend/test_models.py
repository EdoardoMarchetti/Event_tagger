"""Test script for model validation."""
from app.models.event import EventCreate, EventResponse, EventStats
from datetime import datetime

# Test valid data
print("Testing valid EventCreate...")
e = EventCreate(
    minute=15.5,
    second=30.0,
    time_in_second=930.0,
    team='Home',
    event_type='Transition',
    cross_outcome='None',
    shot_outcome='Goal',
    zone=5
)
print("OK: EventCreate validation passed")

# Test invalid minute (negative)
print("\nTesting invalid minute (negative)...")
try:
    e = EventCreate(minute=-1, second=30.0, time_in_second=930.0, team='Home', event_type='Transition')
    print("ERROR: Should have failed")
except Exception as ex:
    print(f"OK: Validation correctly rejected: {type(ex).__name__}")

# Test invalid team
print("\nTesting invalid team...")
try:
    e = EventCreate(minute=15.5, second=30.0, time_in_second=930.0, team='InvalidTeam', event_type='Transition')
    print("ERROR: Should have failed")
except Exception as ex:
    print(f"OK: Validation correctly rejected invalid team: {type(ex).__name__}")

# Test invalid cross_outcome
print("\nTesting invalid cross_outcome...")
try:
    e = EventCreate(minute=15.5, second=30.0, time_in_second=930.0, team='Home', event_type='Transition', cross_outcome='Invalid')
    print("ERROR: Should have failed")
except Exception as ex:
    print(f"OK: Validation correctly rejected invalid cross_outcome: {type(ex).__name__}")

# Test shot_outcome validation with cross_outcome
print("\nTesting shot_outcome validation with cross_outcome='Blocked'...")
try:
    e = EventCreate(minute=15.5, second=30.0, time_in_second=930.0, team='Home', event_type='Transition', cross_outcome='Blocked', shot_outcome='Goal')
    print("ERROR: Should have failed")
except Exception as ex:
    print(f"OK: Validation correctly rejected: {type(ex).__name__}")

print("\nAll validation tests completed!")
