import requests
from app.auth.jwt_handler import generate_tokens
import sys
import json

def test():
    user_id = 51
    email = 'sitepm1@adani.com'
    role = 'Site PM'
    
    tokens = generate_tokens(user_id, email, role)
    access_token = tokens['accessToken']
    
    url = 'http://127.0.0.1:3316/api/dpr-supervisor/pm/entries'
    headers = {'Authorization': f'Bearer {access_token}'}
    
    try:
        r = requests.get(url, headers=headers)
        print(f"Status Code: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"Success! Total Entries received: {len(data)}")
            if len(data) > 0:
                print("First 2 entries:")
                for item in data[:2]:
                    print(f" - ID: {item.get('id')}, Sheet: {item.get('sheet_type')}, Status: {item.get('status')}, Project: {item.get('project_id')}")
                    # check for keys
                    print(f"   Keys available: {list(item.keys())[:5]}...")
        else:
            print(f"Error Response: {r.text}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test()
