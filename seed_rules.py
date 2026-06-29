import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.cobblyn
    
    # Seed rules
    rules = [
        {
            'name': 'Premium Shell Cordovan',
            'description': 'Add 5000 for Shell Cordovan material',
            'active': True,
            'conditions': [
                {'field': 'material', 'operator': 'equals', 'value': 'Shell Cordovan'}
            ],
            'logical_operator': 'AND',
            'action': 'add_price',
            'action_value': 5000,
            'priority': 1
        },
        {
            'name': 'Premium Leather Sole',
            'description': 'Add 2000 for Leather Sole',
            'active': True,
            'conditions': [
                {'field': 'sole_type', 'operator': 'equals', 'value': 'Leather'}
            ],
            'logical_operator': 'AND',
            'action': 'add_price',
            'action_value': 2000,
            'priority': 1
        }
    ]
    
    for rule in rules:
        await db.pricing_rules.update_one({'name': rule['name']}, {'$set': rule}, upsert=True)
        
    print('Seeded pricing rules!')

asyncio.run(main())
