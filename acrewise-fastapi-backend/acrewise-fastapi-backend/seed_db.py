import json
from app.db.session import engine, Base, SessionLocal
from app.models.entities import Farmer, Farm, CropPlan, SowingIntent, PlanFeedback

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(Farmer).count() > 0:
        print("Database already contains data, skipping seed.")
        db.close()
        return

    print("Seeding demo data into SQLite...")
    
    # 1. Farmers
    farmers_data = [
        {"name": "Harpreet Kaur", "phone": "+91 98765 43210", "preferred_language": "pa"},
        {"name": "Gurdeep Singh", "phone": "+91 98123 45678", "preferred_language": "pa"},
        {"name": "Manpreet Singh", "phone": "+91 98234 56789", "preferred_language": "pa"},
        {"name": "Rajesh Kumar", "phone": "+91 98345 67890", "preferred_language": "hi"},
        {"name": "Sukhwinder Singh", "phone": "+91 98456 78901", "preferred_language": "pa"},
        {"name": "Balwinder Kaur", "phone": "+91 98567 89012", "preferred_language": "pa"},
        {"name": "Amarjit Singh", "phone": "+91 98678 90123", "preferred_language": "pa"}
    ]
    
    farmer_objs = []
    for f in farmers_data:
        obj = Farmer(**f)
        db.add(obj)
        farmer_objs.append(obj)
    db.commit()
    for obj in farmer_objs:
        db.refresh(obj)
        
    # 2. Farms
    farms_data = [
        {"farmer_id": farmer_objs[0].id, "name": "Kaur Organic Fields", "state": "Punjab", "district": "Amritsar", "village": "Attari", "acreage": 5.0, "soil_type": "Loamy", "water_availability": "medium", "previous_crop": "Wheat", "preferred_season": "Rabi 2026", "irrigation_method": "Tube well"},
        {"farmer_id": farmer_objs[1].id, "name": "Singh Heritage Farm", "state": "Punjab", "district": "Amritsar", "village": "Majitha", "acreage": 8.5, "soil_type": "Clay", "water_availability": "high", "previous_crop": "Rice", "preferred_season": "Rabi 2026", "irrigation_method": "Canal"},
        {"farmer_id": farmer_objs[2].id, "name": "Green Acres", "state": "Punjab", "district": "Amritsar", "village": "Ajnala", "acreage": 4.0, "soil_type": "Sandy", "water_availability": "low", "previous_crop": "Maize", "preferred_season": "Rabi 2026", "irrigation_method": "Drip"},
        {"farmer_id": farmer_objs[3].id, "name": "Kumar Agro", "state": "Punjab", "district": "Ludhiana", "village": "Sahnewal", "acreage": 6.0, "soil_type": "Loamy", "water_availability": "medium", "previous_crop": "Cotton", "preferred_season": "Rabi 2026", "irrigation_method": "Sprinkler"},
        {"farmer_id": farmer_objs[4].id, "name": "Sukhwinder Fields", "state": "Punjab", "district": "Amritsar", "village": "Rayya", "acreage": 7.0, "soil_type": "Loamy", "water_availability": "medium", "previous_crop": "Rice", "preferred_season": "Rabi 2026", "irrigation_method": "Tube well"},
        {"farmer_id": farmer_objs[5].id, "name": "Kaur Pulses Farm", "state": "Punjab", "district": "Amritsar", "village": "Jandiala", "acreage": 3.5, "soil_type": "Sandy", "water_availability": "low", "previous_crop": "Wheat", "preferred_season": "Rabi 2026", "irrigation_method": "Tube well"},
        {"farmer_id": farmer_objs[6].id, "name": "Guru Nanak Farm", "state": "Punjab", "district": "Amritsar", "village": "Chogawan", "acreage": 10.0, "soil_type": "Loamy", "water_availability": "high", "previous_crop": "Rice", "preferred_season": "Rabi 2026", "irrigation_method": "Tube well"},
    ]
    
    farm_objs = []
    for f in farms_data:
        obj = Farm(**f)
        db.add(obj)
        farm_objs.append(obj)
    db.commit()
    for obj in farm_objs:
        db.refresh(obj)

    # 3. Sowing Intents (with consent_to_aggregate=True to satisfy >= 5 privacy threshold)
    intents = [
        # Wheat in Amritsar (7 contributors, 39 acres total)
        {"farmer_id": farmer_objs[0].id, "crop_name": "Wheat", "acreage": 5.0, "state": "Punjab", "district": "Amritsar", "village": "Attari", "sowing_period": "Nov–Dec 2026", "consent_to_aggregate": True},
        {"farmer_id": farmer_objs[1].id, "crop_name": "Wheat", "acreage": 8.0, "state": "Punjab", "district": "Amritsar", "village": "Majitha", "sowing_period": "Nov–Dec 2026", "consent_to_aggregate": True},
        {"farmer_id": farmer_objs[2].id, "crop_name": "Wheat", "acreage": 4.0, "state": "Punjab", "district": "Amritsar", "village": "Ajnala", "sowing_period": "Nov–Dec 2026", "consent_to_aggregate": True},
        {"farmer_id": farmer_objs[4].id, "crop_name": "Wheat", "acreage": 7.0, "state": "Punjab", "district": "Amritsar", "village": "Rayya", "sowing_period": "Nov–Dec 2026", "consent_to_aggregate": True},
        {"farmer_id": farmer_objs[6].id, "crop_name": "Wheat", "acreage": 10.0, "state": "Punjab", "district": "Amritsar", "village": "Chogawan", "sowing_period": "Nov–Dec 2026", "consent_to_aggregate": True},
        {"farmer_id": farmer_objs[3].id, "crop_name": "Wheat", "acreage": 3.0, "state": "Punjab", "district": "Amritsar", "village": "Verka", "sowing_period": "Nov–Dec 2026", "consent_to_aggregate": True},
        {"farmer_id": farmer_objs[5].id, "crop_name": "Wheat", "acreage": 2.0, "state": "Punjab", "district": "Amritsar", "village": "Jandiala", "sowing_period": "Nov–Dec 2026", "consent_to_aggregate": True},

        # Mustard in Amritsar (6 contributors, 24 acres total)
        {"farmer_id": farmer_objs[0].id, "crop_name": "Mustard", "acreage": 3.0, "state": "Punjab", "district": "Amritsar", "village": "Attari", "sowing_period": "Oct–Nov 2026", "consent_to_aggregate": True},
        {"farmer_id": farmer_objs[1].id, "crop_name": "Mustard", "acreage": 4.0, "state": "Punjab", "district": "Amritsar", "village": "Majitha", "sowing_period": "Oct–Nov 2026", "consent_to_aggregate": True},
        {"farmer_id": farmer_objs[2].id, "crop_name": "Mustard", "acreage": 5.0, "state": "Punjab", "district": "Amritsar", "village": "Ajnala", "sowing_period": "Oct–Nov 2026", "consent_to_aggregate": True},
        {"farmer_id": farmer_objs[4].id, "crop_name": "Mustard", "acreage": 4.0, "state": "Punjab", "district": "Amritsar", "village": "Rayya", "sowing_period": "Oct–Nov 2026", "consent_to_aggregate": True},
        {"farmer_id": farmer_objs[5].id, "crop_name": "Mustard", "acreage": 3.0, "state": "Punjab", "district": "Amritsar", "village": "Jandiala", "sowing_period": "Oct–Nov 2026", "consent_to_aggregate": True},
        {"farmer_id": farmer_objs[6].id, "crop_name": "Mustard", "acreage": 5.0, "state": "Punjab", "district": "Amritsar", "village": "Chogawan", "sowing_period": "Oct–Nov 2026", "consent_to_aggregate": True},

        # Chickpea in Amritsar (5 contributors, 18.5 acres total)
        {"farmer_id": farmer_objs[0].id, "crop_name": "Chickpea", "acreage": 2.0, "state": "Punjab", "district": "Amritsar", "village": "Attari", "sowing_period": "Oct–Nov 2026", "consent_to_aggregate": True},
        {"farmer_id": farmer_objs[2].id, "crop_name": "Chickpea", "acreage": 4.0, "state": "Punjab", "district": "Amritsar", "village": "Ajnala", "sowing_period": "Oct–Nov 2026", "consent_to_aggregate": True},
        {"farmer_id": farmer_objs[3].id, "crop_name": "Chickpea", "acreage": 3.0, "state": "Punjab", "district": "Amritsar", "village": "Verka", "sowing_period": "Oct–Nov 2026", "consent_to_aggregate": True},
        {"farmer_id": farmer_objs[4].id, "crop_name": "Chickpea", "acreage": 4.5, "state": "Punjab", "district": "Amritsar", "village": "Rayya", "sowing_period": "Oct–Nov 2026", "consent_to_aggregate": True},
        {"farmer_id": farmer_objs[5].id, "crop_name": "Chickpea", "acreage": 5.0, "state": "Punjab", "district": "Amritsar", "village": "Jandiala", "sowing_period": "Oct–Nov 2026", "consent_to_aggregate": True},
    ]
    for i in intents:
        db.add(SowingIntent(**i))
    db.commit()

    # 4. Crop Plans & Feedback
    p1 = CropPlan(
        farmer_id=farmer_objs[0].id,
        farm_id=farm_objs[0].id,
        crop_name="Mustard",
        season="Rabi 2026",
        estimated_yield_per_acre=7.0,
        expected_price_per_unit=5950.0,
        cultivation_cost_per_acre=12500.0,
        estimated_revenue_per_acre=41650.0,
        estimated_profit_per_acre=29150.0,
        assumptions_json=json.dumps(["MSP backed rate", "Low water footprint", "Ridge-furrow sowing"])
    )
    p2 = CropPlan(
        farmer_id=farmer_objs[0].id,
        farm_id=farm_objs[0].id,
        crop_name="Wheat",
        season="Rabi 2025",
        estimated_yield_per_acre=18.0,
        expected_price_per_unit=2425.0,
        cultivation_cost_per_acre=18000.0,
        estimated_revenue_per_acre=43650.0,
        estimated_profit_per_acre=25650.0,
        assumptions_json=json.dumps(["Conventional canal + tubewell irrigation"])
    )
    db.add_all([p1, p2])
    db.commit()
    db.refresh(p1)
    db.refresh(p2)

    fb = PlanFeedback(
        plan_id=p2.id,
        actual_crop="Wheat",
        sowing_date="2025-11-10",
        harvested_quantity=17.5,
        actual_selling_price=2430.0,
        actual_cost=17800.0,
        notes="Terminal heat wave slightly lowered grain size, but Mandi procurement at MSP went smoothly."
    )
    db.add(fb)
    db.commit()
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed()
