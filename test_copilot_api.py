#!/usr/bin/env python3
"""
Simple Python script to test both the copilot and blackbox API endpoints used in the LiberGPT Discord bot.
This script replicates the fetchRequest functionality from the JavaScript implementation.
"""

import requests
import urllib.parse
import json


def test_copilot_api(prompt: str) -> str:
    """
    Tests the copilot API endpoint with a given prompt.
    
    Args:
        prompt (str): The user's prompt to send to the AI
        
    Returns:
        str: The AI response content or error message
    """
    try:
        # Base endpoint from the Discord bot
        base_endpoint = "https://api.zpi.my.id/v1/ai/copilot"
        
        # Request body for copilot API
        request_body = {
            "stream": "false",
            "messages": [
                {
                    "role": "system",
                    "content": "You are LiberGPT. A helpful Assistant"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        print(f"🚀 Sending POST request to: {base_endpoint}")
        print(f"📤 Request body: {json.dumps(request_body, indent=2)}")
        
        # Make the POST request
        response = requests.post(
            base_endpoint,
            headers={"Content-Type": "application/json"},
            json=request_body
        )
        
        print(f"✅ HTTP Response Details:")
        print(f"   - Status Code: {response.status_code}")
        print(f"   - Status Text: {response.reason}")
        
        # Check if request was successful
        if not response.ok:
            print(f"❌ HTTP Error Details:")
            print(f"   - Status Code: {response.status_code}")
            print(f"   - Status Text: {response.reason}")
            
            try:
                error_response = response.json()
                print(f"   - Response Body: {json.dumps(error_response, indent=2)}")
            except json.JSONDecodeError:
                text_response = response.text
                print(f"   - Response Body (text): {text_response}")
                error_response = {"error": text_response}
            
            raise Exception(f"HTTP {response.status_code} {response.reason}: {json.dumps(error_response)}")
        
        # Parse JSON response
        response_json = response.json()
        
        # Check for expected response format
        if response_json.get("code") == 200 and response_json.get("response") and response_json["response"].get("content"):
            print(f"🎉 Successfully retrieved content from copilot response.")
            content = response_json["response"]["content"]
            return content
        else:
            print("⚠️ Unexpected response format: 'content' key not found.")
            return "Unexpected response format: 'content' key not found."
            
    except Exception as error:
        print(f"❌ Error occurred: {str(error)}")
        return f"An error occurred: {str(error)}"


def test_blackbox_api(prompt: str) -> str:
    """
    Tests the blackbox API endpoint with a given prompt.
    
    Args:
        prompt (str): The user's prompt to send to the AI
        
    Returns:
        str: The AI response content or error message
    """
    import random
    import string
    
    def generate_random_id():
        """Generate a random alphanumeric ID"""
        return ''.join(random.choices(string.ascii_letters + string.digits, k=15))
    
    try:
        # Base endpoint from the Discord bot
        base_endpoint = "https://api.zpi.my.id/v1/ai/blackbox"
        
        # Request body for blackbox API
        request_body = {
            "mode": "realtime",
            "stream": "false",
            "messages": [
                {
                    "id": generate_random_id(),
                    "role": "system",
                    "content": "You are LiberGPT. A helpful Assistant"
                },
                {
                    "id": generate_random_id(),
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        print(f"🚀 Sending POST request to: {base_endpoint}")
        print(f"📤 Request body: {json.dumps(request_body, indent=2)}")
        
        # Make the POST request
        response = requests.post(
            base_endpoint,
            headers={"Content-Type": "application/json"},
            json=request_body
        )
        
        print(f"✅ HTTP Response Details:")
        print(f"   - Status Code: {response.status_code}")
        print(f"   - Status Text: {response.reason}")
        
        # Check if request was successful
        if not response.ok:
            print(f"❌ HTTP Error Details:")
            print(f"   - Status Code: {response.status_code}")
            print(f"   - Status Text: {response.reason}")
            
            try:
                error_response = response.json()
                print(f"📄 Response Body: {json.dumps(error_response, indent=2)}")
            except (json.JSONDecodeError, ValueError):
                text_response = response.text
                print(f"📄 Response Body (text): {text_response}")
                
            return f"HTTP {response.status_code} {response.reason}: {response.text}"
        
        # Parse the JSON response
        response_json = response.json()
        print(f"📨 Full Response: {json.dumps(response_json, indent=2)}")
        
        # Check for the expected response structure
        if response_json.get("code") == 200 and response_json.get("response") and response_json["response"].get("content"):
            print(f"🎉 Successfully retrieved content from blackbox response.")
            content = response_json["response"]["content"]
            
            # Check for references
            if response_json["response"].get("reference") and len(response_json["response"]["reference"]) > 0:
                print(f"📚 Found {len(response_json['response']['reference'])} references from blackbox model.")
                references = response_json["response"]["reference"]
                reference_text = "\n\n**References:**\n"
                for i, ref in enumerate(references):
                    reference_text += f"{i + 1}. [{ref['title']}]({ref['link']})\n"
                content += reference_text
            
            return content
        else:
            print("⚠️ Unexpected response format: 'content' key not found.")
            return "Unexpected response format: 'content' key not found."
            
    except Exception as error:
        print(f"❌ Error occurred: {str(error)}")
        return f"An error occurred: {str(error)}"


def main():
    """
    Main function to test both copilot and blackbox APIs with sample prompts.
    """
    print("=" * 60)
    print("LiberGPT AI API Test Script")
    print("=" * 60)
    
    # Test prompt
    test_prompt = "Hello! Can you explain what Python is in a simple way?"
    
    print(f"📝 Testing with prompt: '{test_prompt}'")
    print(f"📏 Prompt length: {len(test_prompt)} characters")
    print()
    
    # Test Copilot API
    print("🤖 Testing Copilot API...")
    print("-" * 30)
    copilot_result = test_copilot_api(test_prompt)
    
    print()
    print("📄 Copilot API Response:")
    print("-" * 30)
    print(copilot_result)
    print(f"📏 Response length: {len(copilot_result)} characters")
    print()
    
    # Test Blackbox API
    print("🔲 Testing Blackbox API...")
    print("-" * 30)
    blackbox_result = test_blackbox_api(test_prompt)
    
    print()
    print("📄 Blackbox API Response:")
    print("-" * 30)
    print(blackbox_result)
    print(f"📏 Response length: {len(blackbox_result)} characters")
    print("=" * 60)


if __name__ == "__main__":
    main()
