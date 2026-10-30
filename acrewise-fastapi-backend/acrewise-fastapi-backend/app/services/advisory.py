import re
from app.schemas.crops import AdvisoryChatRequest, AdvisoryChatResponse
from app.services.crop_engine import CROPS

# Agronomic knowledge base in English, Hindi, and Punjabi
KNOWLEDGE_BASE = [
    {
        "keywords": ["paddy", "rice", "wheat", "rotation", "after paddy", "ਝੋਨਾ", "ਕਣਕ", "धान", "गेहूं"],
        "en": "Rotating Paddy with Mustard or Chickpea instead of continuous Wheat saves up to 40% groundwater, breaks pest/weed cycles (like Phalaris minor in wheat), and adds natural nitrogen to your field.",
        "hi": "धान के बाद केवल गेहूं लगाने के बजाय सरसों या चना लगाने से 40% तक भूजल की बचत होती है, खरपतवार चक्र टूटता है और मिट्टी को प्राकृतिक नाइट्रोजन मिलती है।",
        "pa": "ਝੋਨੇ ਤੋਂ ਬਾਅਦ ਸਿਰਫ਼ ਕਣਕ ਬੀਜਣ ਦੀ ਬਜਾਏ ਸਰ੍ਹੋਂ ਜਾਂ ਛੋਲੇ ਲਗਾਉਣ ਨਾਲ 40% ਤੱਕ ਧਰਤੀ ਹੇਠਲੇ ਪਾਣੀ ਦੀ ਬਚਤ ਹੁੰਦੀ ਹੈ ਅਤੇ ਗੁੱਲੀ-ਡੰਡੇ ਵਰਗੇ ਨਦੀਨਾਂ ਦਾ ਚੱਕਰ ਟੁੱਟਦਾ ਹੈ।",
        "crops": ["Mustard", "Chickpea", "Wheat"]
    },
    {
        "keywords": ["nitrogen", "soil", "health", "fertilizer", "urea", "dap", "ਮਿੱਟੀ", "ਯੂਰੀਆ", "खाद", "यूरिया"],
        "en": "Legume crops like Chickpea and Moong fix 30-38 kg of atmospheric nitrogen per acre through Rhizobium root nodules. This saves approximately ₹1,500-₹2,000 per acre in Urea/DAP costs for your next crop.",
        "hi": "चना और मूंग जैसी दलहनी फसलें राइजोबियम बैक्टीरिया द्वारा प्रति एकड़ 30-38 किलो प्राकृतिक नाइट्रोजन मिट्टी में जमा करती हैं। इससे अगली फसल में ₹1,500-₹2,000 प्रति एकड़ यूरिया/डीएपी की बचत होती है।",
        "pa": "ਛੋਲੇ ਅਤੇ ਮੂੰਗੀ ਦੀਆਂ ਫ਼ਸਲਾਂ ਜੜ੍ਹਾਂ ਵਿੱਚ ਮੌਜੂਦ ਬੈਕਟੀਰੀਆ ਰਾਹੀਂ ਪ੍ਰਤੀ ਏਕੜ 30-38 ਕਿਲੋ ਕੁਦਰਤੀ ਨਾਈਟ੍ਰੋਜਨ ਜਮ੍ਹਾ ਕਰਦੀਆਂ ਹਨ। ਇਸ ਨਾਲ ਅਗਲੀ ਫ਼ਸਲ ਲਈ ₹1,500-₹2,000 ਪ੍ਰਤੀ ਏਕੜ ਯੂਰੀਆ ਦੀ ਬਚਤ ਹੁੰਦੀ ਹੈ।",
        "crops": ["Chickpea", "Moong"]
    },
    {
        "keywords": ["msp", "price", "rate", "government", "ਖਰੀਦ", "ਸਰਕਾਰੀ ਭਾਅ", "एमएसपी", "सरकारी रेट"],
        "en": "Current Minimum Support Prices (MSP 2025-26): Wheat is ₹2,425/q, Mustard is ₹5,950/q, Chickpea is ₹5,650/q, Moong is ₹8,768/q, and Paddy is ₹2,320/q. AcreWise uses these official MSP floors as financial shock absorbers in our What-If model.",
        "hi": "वर्तमान न्यूनतम समर्थन मूल्य (MSP 2025-26): गेहूं ₹2,425/क्विंटल, सरसों ₹5,950/क्विंटल, चना ₹5,650/क्विंटल, मूंग ₹8,768/क्विंटल और धान ₹2,320/क्विंटल है। एकरवाइज इन दरों को 'व्हाट-इफ' मॉडल में गारंटीड मूल्य सुरक्षा के रूप में उपयोग करता है।",
        "pa": "ਮੌਜੂਦਾ ਸਰਕਾਰੀ ਐੱਮ.ਐੱਸ.ਪੀ. (MSP 2025-26): ਕਣਕ ₹2,425/ਕੁਇੰਟਲ, ਸਰ੍ਹੋਂ ₹5,950/ਕੁਇੰਟਲ, ਛੋਲੇ ₹5,650/ਕੁਇੰਟਲ, ਮੂੰਗੀ ₹8,768/ਕੁਇੰਟਲ ਅਤੇ ਝੋਨਾ ₹2,320/ਕੁਇੰਟਲ ਹੈ। ਏਕਰਵਾਈਜ਼ ਇਸ ਨੂੰ 'ਵੱਟ-ਇਫ' ਮਾਡਲ ਵਿੱਚ ਸੁਰੱਖਿਆ ਕਵਚ ਵਜੋਂ ਸ਼ਾਮਲ ਕਰਦਾ ਹੈ।",
        "crops": ["Wheat", "Mustard", "Chickpea", "Moong", "Rice"]
    },
    {
        "keywords": ["water", "drought", "irrigation", "tubewell", "ਪਾਣੀ", "ਸੋਕਾ", "ਟਿਊਬਵੈੱਲ", "पानी", "सूखा", "सिंचाई"],
        "en": "Paddy consumes ~3.5 million liters of water per acre, whereas Mustard needs only ~750,000 liters and Chickpea ~550,000 liters. In low water or drought scenarios, switching to oilseeds or pulses reduces tubewell electricity/diesel pumping costs by up to 70%.",
        "hi": "धान में प्रति एकड़ लगभग 35 लाख लीटर पानी लगता है, जबकि सरसों में केवल 7.5 लाख लीटर और चने में 5.5 लाख लीटर पानी की आवश्यकता होती है। पानी की कमी में दलहन और तिलहन लगाने से डीजल और बिजली का खर्च 70% तक घट जाता है।",
        "pa": "ਝੋਨੇ ਨੂੰ ਪ੍ਰਤੀ ਏਕੜ ਲਗਭਗ 35 ਲੱਖ ਲੀਟਰ ਪਾਣੀ ਦੀ ਲੋੜ ਹੁੰਦੀ ਹੈ, ਜਦਕਿ ਸਰ੍ਹੋਂ ਨੂੰ ਸਿਰਫ਼ 7.5 ਲੱਖ ਲੀਟਰ ਅਤੇ ਛੋਲਿਆਂ ਨੂੰ 5.5 ਲੱਖ ਲੀਟਰ। ਪਾਣੀ ਦੀ ਘਾਟ ਵਾਲੇ ਖੇਤਰਾਂ ਵਿੱਚ ਸਰ੍ਹੋਂ ਜਾਂ ਛੋਲੇ ਬੀਜਣ ਨਾਲ ਟਿਊਬਵੈੱਲ ਦਾ ਖਰਚਾ 70% ਤੱਕ ਘਟ ਜਾਂਦਾ ਹੈ।",
        "crops": ["Mustard", "Chickpea", "Rice"]
    },
    {
        "keywords": ["insurance", "pmfby", "scheme", "subsidy", "ਬੀਮਾ", "ਸਬਸਿਡੀ", "ਸਕੀਮ", "बीमा", "सब्सिडी", "योजना"],
        "en": "Under PMFBY (Pradhan Mantri Fasal Bima Yojana), farmers pay a minimal premium of only 1.5% for Rabi crops (Wheat/Mustard/Gram) and 2% for Kharif crops. In our What-If simulation, having PMFBY compensates up to 70% of crop losses in case of unseasonal rain, frost, or pest outbreaks.",
        "hi": "प्रधानमंत्री फसल बीमा योजना (PMFBY) के तहत रबी फसलों के लिए केवल 1.5% और खरीफ फसलों के लिए 2% प्रीमियम देना होता है। बेमौसम बारिश, पाला या कीट हमले पर यह 70% तक नुकसान की भरपाई करता है।",
        "pa": "ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਫ਼ਸਲ ਬੀਮਾ ਯੋਜਨਾ (PMFBY) ਅਧੀਨ ਹਾੜ੍ਹੀ ਦੀਆਂ ਫ਼ਸਲਾਂ (ਕਣਕ/ਸਰ੍ਹੋਂ/ਛੋਲੇ) ਲਈ ਸਿਰਫ਼ 1.5% ਅਤੇ ਸਾਉਣੀ ਲਈ 2% ਪ੍ਰੀਮੀਅਮ ਦੇਣਾ ਪੈਂਦਾ ਹੈ। ਬੇਮੌਸਮੀ ਬਾਰਿਸ਼ ਜਾਂ ਕੀੜਿਆਂ ਦੇ ਹਮਲੇ ਵਿੱਚ ਇਹ ਬਹੁਤ ਵੱਡਾ ਸਹਾਰਾ ਬਣਦਾ ਹੈ।",
        "crops": ["Wheat", "Mustard", "Chickpea"]
    }
]

DEFAULT_SUGGESTIONS = {
    "en": [
        "What crop should I grow after Paddy?",
        "How does Chickpea improve soil health?",
        "What is the MSP rate for Mustard and Wheat?",
        "How does What-If simulate drought?"
    ],
    "hi": [
        "धान के बाद कौन सी फसल लगाना सबसे अच्छा है?",
        "चना और मूंग मिट्टी की सेहत कैसे सुधारते हैं?",
        "सरसों और गेहूं का सरकारी MSP क्या है?",
        "सूखे या बारिश की कमी में क्या करें?"
    ],
    "pa": [
        "ਝੋਨੇ ਤੋਂ ਬਾਅਦ ਕਿਹੜੀ ਫ਼ਸਲ ਲਗਾਉਣੀ ਚਾਹੀਦੀ ਹੈ?",
        "ਛੋਲੇ ਮਿੱਟੀ ਦੀ ਸਿਹਤ ਕਿਵੇਂ ਸੁਧਾਰਦੇ ਹਨ?",
        "ਸਰ੍ਹੋਂ ਅਤੇ ਕਣਕ ਦਾ ਸਰਕਾਰੀ ਐੱਮ.ਐੱਸ.ਪੀ. ਕੀ ਹੈ?",
        "ਪਾਣੀ ਦੀ ਘਾਟ ਜਾਂ ਸੋਕੇ ਵਿੱਚ ਕਿਹੜੀ ਫ਼ਸਲ ਵਧੀਆ ਰਹੇਗੀ?"
    ]
}

def generate_advisory_reply(req: AdvisoryChatRequest) -> AdvisoryChatResponse:
    lang = req.language if req.language in ("en", "hi", "pa") else "en"
    text = req.message.lower().strip()
    
    # Match keywords
    matched_entry = None
    max_matches = 0
    
    for entry in KNOWLEDGE_BASE:
        matches = sum(1 for kw in entry["keywords"] if kw in text)
        if matches > max_matches:
            max_matches = matches
            matched_entry = entry
            
    if matched_entry and max_matches > 0:
        reply = matched_entry[lang]
        referenced_crops = matched_entry.get("crops", [])
    else:
        # Contextual dynamic response based on farm profile if provided
        acres = req.farm_context.get("acres", 5) if req.farm_context else 5
        soil = req.farm_context.get("soil", "Loamy") if req.farm_context else "Loamy"
        water = req.farm_context.get("water", "Medium") if req.farm_context else "Medium"
        
        if lang == "hi":
            reply = (
                f"आपके {acres} एकड़ खेत (मिट्टी: {soil}, पानी: {water}) के लिए, हम अधिक लाभ और जल संरक्षण हेतु "
                f"कणक/गेहूं के साथ-साथ सरसों या चने के विविधीकरण की सिफारिश करते हैं। आप हमारे 'व्हाट-इफ सिमुलेटर' "
                f"में सूखे और बाजार गिरावट का प्रभाव भी टेस्ट कर सकते हैं।"
            )
        elif lang == "pa":
            reply = (
                f"ਤੁਹਾਡੇ {acres} ਏਕੜ ਖੇਤ (ਮਿੱਟੀ: {soil}, ਪਾਣੀ: {water}) ਲਈ, ਅਸੀਂ ਵੱਧ ਮੁਨਾਫ਼ੇ ਅਤੇ ਪਾਣੀ ਦੀ ਬਚਤ ਲਈ "
                f"ਕਣਕ ਦੇ ਨਾਲ-ਨਾਲ ਸਰ੍ਹੋਂ ਜਾਂ ਛੋਲਿਆਂ ਦੀ ਫ਼ਸਲ ਬੀਜਣ ਦੀ ਸਲਾਹ ਦਿੰਦੇ ਹਾਂ। ਤੁਸੀਂ ਸਾਡੇ 'ਵੱਟ-ਇਫ ਕੰਡੀਸ਼ਨ' "
                f"ਟੈਬ ਵਿੱਚ ਜਾ ਕੇ ਸੋਕੇ ਅਤੇ ਮੰਡੀ ਦੇ ਉਤਰਾਅ-ਚੜ੍ਹਾਅ ਦਾ ਅਸਰ ਵੀ ਦੇਖ ਸਕਦੇ ਹੋ।"
            )
        else:
            reply = (
                f"For your {acres}-acre farm with {soil} soil and {water} water availability, AcreWise recommends "
                f"exploring Mustard or Chickpea alongside Wheat for superior groundwater conservation and biological "
                f"nitrogen fixation. You can also test weather and price shocks in our new 'What-If Simulation' tab."
            )
        referenced_crops = ["Wheat", "Mustard", "Chickpea"]
        
    suggestions = DEFAULT_SUGGESTIONS.get(lang, DEFAULT_SUGGESTIONS["en"])
    
    return AdvisoryChatResponse(
        reply=reply,
        suggested_questions=suggestions,
        language=lang,
        referenced_crops=referenced_crops
    )
