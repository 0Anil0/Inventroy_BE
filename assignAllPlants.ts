import { User, Plant, UserPlant } from './src/models';
import { sequelize } from './src/config/database';

const run = async () => {
  await sequelize.sync();
  const users = await User.findAll();
  const plants = await Plant.findAll();
  
  for (const user of users) {
    for (const plant of plants) {
      await UserPlant.findOrCreate({ where: { user_id: user.id, plant_id: plant.id } });
    }
  }
  console.log('Successfully assigned all plants to all users');
  process.exit(0);
};

run().catch(console.error);
