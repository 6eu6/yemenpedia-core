// =============================================
// Yemenpedia - Seed Data
// موسوعة اليمن الوطنية - البيانات الأولية
// =============================================

import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 بدء زرع البيانات...');
  console.log('⏳ جاري الاتصال بقاعدة البيانات...');

  try {
    // Test connection first
    await db.$queryRaw`SELECT 1 as test`;
    console.log('✅ الاتصال بقاعدة البيانات ناجح');

    // =============================================
    // 1. إنشاء المستخدم الإداري
    // =============================================
    console.log('\n👤 إنشاء المستخدم الإداري...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await db.user.upsert({
      where: { email: 'admin@yemenpedia.org' },
      update: {},
      create: {
      id: 'admin-user-001',
      email: 'admin@yemenpedia.org',
      username: 'admin',
      name: 'مدير الموسوعة',
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
      bio: 'مدير موسوعة اليمن الوطنية - Yemenpedia',
      preferredLang: 'ar',
      updatedAt: new Date(),
    },
    });
    console.log('✅ تم إنشاء المستخدم الإداري:', adminUser.id);

    // =============================================
    // 2. إنشاء الأقسام الرئيسية
    // =============================================
    console.log('\n📚 إنشاء الأقسام الرئيسية...');
    
    const categories = [
      {
        id: 'cat-history',
        name: 'التاريخ',
        nameEn: 'History',
        slug: 'history',
        description: 'قسم التاريخ اليمني - من الحضارات القديمة إلى العصر الحديث',
        descriptionEn: 'Yemeni History section - from ancient civilizations to modern times',
        icon: 'Scroll',
        order: 1,
      },
      {
        id: 'cat-geography',
        name: 'الجغرافيا',
        nameEn: 'Geography',
        slug: 'geography',
        description: 'الجغرافيا اليمنية - التضاريس والمناخ والموارد الطبيعية',
        descriptionEn: 'Yemeni Geography - terrain, climate, and natural resources',
        icon: 'Map',
        order: 2,
      },
      {
        id: 'cat-culture',
        name: 'الثقافة والتراث',
        nameEn: 'Culture & Heritage',
        slug: 'culture',
        description: 'الثقافة والتراث اليمني - العادات والتقاليد والفنون',
        descriptionEn: 'Yemeni Culture and Heritage - customs, traditions, and arts',
        icon: 'Palette',
        order: 3,
      },
      {
        id: 'cat-people',
        name: 'الشخصيات',
        nameEn: 'Personalities',
        slug: 'personalities',
        description: 'شخصيات يمنية بارزة - العلماء والأدباء والقادة',
        descriptionEn: 'Prominent Yemeni personalities - scholars, writers, and leaders',
        icon: 'Users',
        order: 4,
      },
      {
        id: 'cat-places',
        name: 'الأماكن',
        nameEn: 'Places',
        slug: 'places',
        description: 'الأماكن التاريخية والسياحية في اليمن',
        descriptionEn: 'Historical and tourist places in Yemen',
        icon: 'MapPin',
        order: 5,
      },
      {
        id: 'cat-science',
        name: 'العلوم',
        nameEn: 'Sciences',
        slug: 'sciences',
        description: 'العلوم في اليمن - الإنجازات العلمية والاكتشافات',
        descriptionEn: 'Sciences in Yemen - scientific achievements and discoveries',
        icon: 'FlaskConical',
        order: 6,
      },
      {
        id: 'cat-literature',
        name: 'الأدب',
        nameEn: 'Literature',
        slug: 'literature',
        description: 'الأدب اليمني - الشعر والنثر والأعمال الأدبية',
        descriptionEn: 'Yemeni Literature - poetry, prose, and literary works',
        icon: 'BookOpen',
        order: 7,
      },
      {
        id: 'cat-economy',
        name: 'الاقتصاد',
        nameEn: 'Economy',
        slug: 'economy',
        description: 'الاقتصاد اليمني - الموارد والصناعات والتجارة',
        descriptionEn: 'Yemeni Economy - resources, industries, and trade',
        icon: 'TrendingUp',
        order: 8,
      },
    ];

    for (const category of categories) {
      await db.category.upsert({
        where: { slug: category.slug },
        update: { updatedAt: new Date() },
        create: {
          ...category,
          createdBy: adminUser.id,
          updatedAt: new Date(),
        },
      });
    }
    console.log('✅ تم إنشاء', categories.length, 'قسم');

    // =============================================
    // 3. إنشاء المحافظات اليمنية
    // =============================================
    console.log('\n🗺️ إنشاء المحافظات اليمنية...');
    
    const governorates = [
      { id: 'gov-amana', name: 'أمانة العاصمة', nameEn: 'Amanat Al Asimah', capital: 'صنعاء', capitalEn: "Sana'a", population: 2750000, area: 495 },
      { id: 'gov-sanaa', name: 'صنعاء', nameEn: "Sana'a", capital: 'صنعاء', capitalEn: "Sana'a", population: 1100000, area: 13786 },
      { id: 'gov-aden', name: 'عدن', nameEn: 'Aden', capital: 'عدن', capitalEn: 'Aden', population: 860000, area: 760 },
      { id: 'gov-taiz', name: 'تعز', nameEn: 'Taiz', capital: 'تعز', capitalEn: 'Taiz', population: 2700000, area: 10675 },
      { id: 'gov-hudaydah', name: 'الحديدة', nameEn: 'Al Hudaydah', capital: 'الحديدة', capitalEn: 'Al Hudaydah', population: 2700000, area: 13848 },
      { id: 'gov-ibb', name: 'إب', nameEn: 'Ibb', capital: 'إب', capitalEn: 'Ibb', population: 2600000, area: 5836 },
      { id: 'gov-dhamar', name: 'ذمار', nameEn: 'Dhamar', capital: 'ذمار', capitalEn: 'Dhamar', population: 1600000, area: 9495 },
      { id: 'gov-hadramaut', name: 'حضرموت', nameEn: 'Hadramaut', capital: 'المكلا', capitalEn: 'Al Mukalla', population: 1400000, area: 191737 },
      { id: 'gov-hajjah', name: 'حجة', nameEn: 'Hajjah', capital: 'حجة', capitalEn: 'Hajjah', population: 1900000, area: 10054 },
      { id: 'gov-mahwit', name: 'المحويت', nameEn: 'Al Mahwit', capital: 'المحويت', capitalEn: 'Al Mahwit', population: 570000, area: 2342 },
      { id: 'gov-maqatirah', name: 'المقاطرة', nameEn: 'Al Maqatirah', capital: 'المقاطرة', capitalEn: 'Al Maqatirah', population: 280000, area: 1200 },
      { id: 'gov-amran', name: 'عمران', nameEn: 'Amran', capital: 'عمران', capitalEn: 'Amran', population: 950000, area: 7922 },
      { id: 'gov-sadah', name: 'صعدة', nameEn: "Sa'dah", capital: 'صعدة', capitalEn: "Sa'dah", population: 830000, area: 15376 },
      { id: 'gov-jawf', name: 'الجوف', nameEn: 'Al Jawf', capital: 'الجويدة', capitalEn: 'Al Hazm', population: 560000, area: 30989 },
      { id: 'gov-marib', name: 'مأرب', nameEn: "Ma'rib", capital: 'مأرب', capitalEn: "Ma'rib", population: 300000, area: 31192 },
      { id: 'gov-shabwah', name: 'شبوة', nameEn: 'Shabwah', capital: 'عتق', capitalEn: 'Ataq', population: 570000, area: 47728 },
      { id: 'gov-lahij', name: 'لحج', nameEn: 'Lahij', capital: 'الحوطة', capitalEn: 'Al Hawtah', population: 920000, area: 12766 },
      { id: 'gov-abyan', name: 'أبين', nameEn: 'Abyan', capital: 'زنجبار', capitalEn: 'Zinjibar', population: 510000, area: 16859 },
      { id: 'gov-dali', name: 'الضالع', nameEn: 'Ad Dali', capital: 'الضالع', capitalEn: 'Ad Dali', population: 580000, area: 4864 },
      { id: 'gov-bayda', name: 'البيضاء', nameEn: 'Al Bayda', capital: 'البيضاء', capitalEn: 'Al Bayda', population: 720000, area: 10465 },
      { id: 'gov-raymah', name: 'ريمة', nameEn: 'Raymah', capital: 'الجبين', capitalEn: 'Al Jabin', population: 480000, area: 2442 },
      { id: 'gov-mahrah', name: 'المهرة', nameEn: 'Al Mahrah', capital: 'الغيضة', capitalEn: 'Al Ghaydah', population: 120000, area: 82405 },
      { id: 'gov-socotra', name: 'سقطرى', nameEn: 'Socotra', capital: 'حديبو', capitalEn: 'Hadibu', population: 60000, area: 3654 },
    ];

    for (const gov of governorates) {
      await db.governorate.upsert({
        where: { id: gov.id },
        update: { updatedAt: new Date() },
        create: { ...gov, updatedAt: new Date() },
      });
    }
    console.log('✅ تم إنشاء', governorates.length, 'محافظة');

    console.log('\n' + '='.repeat(50));
    console.log('✅ تم زرع البيانات بنجاح!');
    console.log('='.repeat(50));
    console.log('\n📊 الملخصات:');
    console.log('   - الأقسام:', categories.length);
    console.log('   - المحافظات:', governorates.length);
    console.log('\n🔑 بيانات الدخول:');
    console.log('   - البريد: admin@yemenpedia.org');
    console.log('   - كلمة المرور: admin123');

  } catch (error) {
    console.error('\n❌ خطأ في زرع البيانات:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
