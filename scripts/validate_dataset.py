import json
import os
import sys

def validate_dataset(file_path):
    print(f"Validating: {file_path}")
    
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        return False
        
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format: {e}")
        return False
    except Exception as e:
        print(f"Error reading file: {e}")
        return False
        
    topics = []
    if isinstance(data, list):
        topics = data
    elif isinstance(data, dict):
        if 'argomenti' in data and isinstance(data['argomenti'], list):
            topics = data['argomenti']
        else:
            topics = [data]
    
    if not topics:
        print("Error: Dataset must be a list of topics or an object containing an 'argomenti' list.")
        return False
        
    errors = []
    
    for t_idx, topic in enumerate(topics):
        topic_name = topic.get('argomento', f'Topic {t_idx + 1}')
        
        if 'argomento' not in topic:
            errors.append(f"Topic {t_idx + 1}: Missing 'argomento' field.")
            
        domande = topic.get('domande', [])
        if not isinstance(domande, list) or len(domande) == 0:
            errors.append(f"Topic '{topic_name}': Missing or empty 'domande' list.")
            continue
            
        for q_idx, question in enumerate(domande):
            q_label = f"Topic '{topic_name}', Question {q_idx + 1}"
            
            # Required fields
            if 'testo_domanda' not in question:
                errors.append(f"{q_label}: Missing 'testo_domanda'.")
            if 'difficolta' not in question:
                errors.append(f"{q_label}: Missing 'difficolta'.")
            elif not (1 <= question['difficolta'] <= 5):
                errors.append(f"{q_label}: 'difficolta' must be between 1 and 5.")
                
            # Answers
            risposte = question.get('risposte', [])
            if not isinstance(risposte, list) or len(risposte) < 2:
                errors.append(f"{q_label}: Must have at least 2 answers.")
            else:
                for r_idx, answer in enumerate(risposte):
                    if 'testo_risposta' not in answer:
                        errors.append(f"{q_label}, Answer {r_idx + 1}: Missing 'testo_risposta'.")
                    if 'spiegazione_vera_o_falsa' not in answer:
                        errors.append(f"{q_label}, Answer {r_idx + 1}: Missing 'spiegazione_vera_o_falsa'.")
            
            # Correct answer index
            corretta = question.get('risposta_corretta')
            if corretta is None:
                errors.append(f"{q_label}: Missing 'risposta_corretta'.")
            elif not (0 <= corretta < len(risposte)):
                errors.append(f"{q_label}: 'risposta_corretta' index {corretta} out of range (0-{len(risposte)-1}).")
                
    if errors:
        print(f"\nFound {len(errors)} errors:")
        for err in errors:
            print(f"- {err}")
        return False
    else:
        print("\nSuccess! Dataset is valid and follows QuizMaker schema.")
        return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_dataset.py <path_to_json>")
        sys.exit(1)
        
    target = sys.argv[1]
    if os.path.isdir(target):
        # Validate all json files in directory
        files = [os.path.join(target, f) for f in os.listdir(target) if f.endswith('.json')]
        all_ok = True
        for f in files:
            if not validate_dataset(f):
                all_ok = False
            print("-" * 20)
        sys.exit(0 if all_ok else 1)
    else:
        success = validate_dataset(target)
        sys.exit(0 if success else 1)
