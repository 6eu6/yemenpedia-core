// =============================================
// Yemenpedia - Seed Data
// موسوعة اليمن الوطنية - البيانات الأولية
// =============================================

import { PrismaClient, UserRole, ArticleStatus, BadgeType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء زرع البيانات...');

  // =============================================
  // 1. إنشاء المستخدم الإداري
  // =============================================
  console.log('👤 إنشاء المستخدم الإداري...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@yemenpedia.org' },
    update: {},
    create: {
      email: 'admin@yemenpedia.org',
      username: 'admin',
      name: 'مدير الموسوعة',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isVerified: true,
      isActive: true,
      bio: 'مدير موسوعة اليمن الوطنية - Yemenpedia',
      preferredLang: 'ar',
    },
  });

  // إضافة شارة الرائد للمدير
  await prisma.userBadge.upsert({
    where: {
      userId_badgeType: {
        userId: adminUser.id,
        badgeType: BadgeType.PIONEER,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      badgeType: BadgeType.PIONEER,
    },
  });

  console.log('✅ تم إنشاء المستخدم الإداري');

  // =============================================
  // 2. إنشاء الأقسام الرئيسية
  // =============================================
  console.log('📚 إنشاء الأقسام الرئيسية...');
  
  const categories = [
    {
      name: 'التاريخ',
      nameEn: 'History',
      slug: 'history',
      description: 'قسم التاريخ اليمني - من الحضارات القديمة إلى العصر الحديث',
      descriptionEn: 'Yemeni History section - from ancient civilizations to modern times',
      icon: 'Scroll',
      order: 1,
    },
    {
      name: 'الجغرافيا',
      nameEn: 'Geography',
      slug: 'geography',
      description: 'الجغرافيا اليمنية - التضاريس والمناخ والموارد الطبيعية',
      descriptionEn: 'Yemeni Geography - terrain, climate, and natural resources',
      icon: 'Map',
      order: 2,
    },
    {
      name: 'الثقافة والتراث',
      nameEn: 'Culture & Heritage',
      slug: 'culture',
      description: 'الثقافة والتراث اليمني - العادات والتقاليد والفنون',
      descriptionEn: 'Yemeni Culture and Heritage - customs, traditions, and arts',
      icon: 'Palette',
      order: 3,
    },
    {
      name: 'الشخصيات',
      nameEn: 'Personalities',
      slug: 'personalities',
      description: 'شخصيات يمنية بارزة - العلماء والأدباء والقادة',
      descriptionEn: 'Prominent Yemeni personalities - scholars, writers, and leaders',
      icon: 'Users',
      order: 4,
    },
    {
      name: 'الأماكن',
      nameEn: 'Places',
      slug: 'places',
      description: 'الأماكن التاريخية والسياحية في اليمن',
      descriptionEn: 'Historical and tourist places in Yemen',
      icon: 'MapPin',
      order: 5,
    },
    {
      name: 'العلوم',
      nameEn: 'Sciences',
      slug: 'sciences',
      description: 'العلوم في اليمن - الإنجازات العلمية والاكتشافات',
      descriptionEn: 'Sciences in Yemen - scientific achievements and discoveries',
      icon: 'FlaskConical',
      order: 6,
    },
    {
      name: 'الأدب',
      nameEn: 'Literature',
      slug: 'literature',
      description: 'الأدب اليمني - الشعر والنثر والأعمال الأدبية',
      descriptionEn: 'Yemeni Literature - poetry, prose, and literary works',
      icon: 'BookOpen',
      order: 7,
    },
    {
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
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        ...category,
        createdBy: adminUser.id,
      },
    });
  }
  console.log('✅ تم إنشاء الأقسام الرئيسية');

  // =============================================
  // 3. إنشاء المحافظات اليمنية (22 محافظة)
  // =============================================
  console.log('🗺️ إنشاء المحافظات اليمنية...');
  
  const governorates = [
    {
      name: 'أمانة العاصمة',
      nameEn: 'Amanat Al Asimah',
      capital: 'صنعاء',
      capitalEn: "Sana'a",
      population: 2750000,
      area: 495,
      coordinates: { lat: 15.3694, lng: 44.1910, zoom: 12 },
    },
    {
      name: 'صنعاء',
      nameEn: "Sana'a",
      capital: 'صنعاء',
      capitalEn: "Sana'a",
      population: 1100000,
      area: 13786,
      coordinates: { lat: 15.3525, lng: 44.2075, zoom: 10 },
    },
    {
      name: 'عدن',
      nameEn: 'Aden',
      capital: 'عدن',
      capitalEn: 'Aden',
      population: 860000,
      area: 760,
      coordinates: { lat: 12.7794, lng: 45.0367, zoom: 12 },
    },
    {
      name: 'تعز',
      nameEn: 'Taiz',
      capital: 'تعز',
      capitalEn: 'Taiz',
      population: 2700000,
      area: 10675,
      coordinates: { lat: 13.5789, lng: 44.0219, zoom: 11 },
    },
    {
      name: 'الحديدة',
      nameEn: 'Al Hudaydah',
      capital: 'الحديدة',
      capitalEn: 'Al Hudaydah',
      population: 2700000,
      area: 13848,
      coordinates: { lat: 14.7928, lng: 42.9544, zoom: 10 },
    },
    {
      name: 'إب',
      nameEn: 'Ibb',
      capital: 'إب',
      capitalEn: 'Ibb',
      population: 2600000,
      area: 5836,
      coordinates: { lat: 13.9750, lng: 44.1708, zoom: 11 },
    },
    {
      name: 'ذمار',
      nameEn: 'Dhamar',
      capital: 'ذمار',
      capitalEn: 'Dhamar',
      population: 1600000,
      area: 9495,
      coordinates: { lat: 14.5428, lng: 44.4056, zoom: 11 },
    },
    {
      name: 'حضرموت',
      nameEn: 'Hadramaut',
      capital: 'المكلا',
      capitalEn: 'Al Mukalla',
      population: 1400000,
      area: 191737,
      coordinates: { lat: 15.9422, lng: 48.7889, zoom: 8 },
    },
    {
      name: 'حجة',
      nameEn: 'Hajjah',
      capital: 'حجة',
      capitalEn: 'Hajjah',
      population: 1900000,
      area: 10054,
      coordinates: { lat: 15.6944, lng: 43.6056, zoom: 10 },
    },
    {
      name: 'المحويت',
      nameEn: 'Al Mahwit',
      capital: 'المحويت',
      capitalEn: 'Al Mahwit',
      population: 570000,
      area: 2342,
      coordinates: { lat: 15.4597, lng: 43.5444, zoom: 11 },
    },
    {
      name: 'المقاطرة',
      nameEn: 'Al Maqatirah',
      capital: 'المقاطرة',
      capitalEn: 'Al Maqatirah',
      population: 280000,
      area: 1200,
      coordinates: { lat: 13.9500, lng: 44.1000, zoom: 11 },
    },
    {
      name: 'عمران',
      nameEn: 'Amran',
      capital: 'عمران',
      capitalEn: 'Amran',
      population: 950000,
      area: 7922,
      coordinates: { lat: 15.6594, lng: 43.9358, zoom: 11 },
    },
    {
      name: 'صعدة',
      nameEn: "Sa'dah",
      capital: 'صعدة',
      capitalEn: "Sa'dah",
      population: 830000,
      area: 15376,
      coordinates: { lat: 17.0297, lng: 43.7631, zoom: 10 },
    },
    {
      name: 'الجوف',
      nameEn: 'Al Jawf',
      capital: 'الجويدة',
      capitalEn: 'Al Hazm',
      population: 560000,
      area: 30989,
      coordinates: { lat: 16.6417, lng: 45.2972, zoom: 9 },
    },
    {
      name: 'مأرب',
      nameEn: "Ma'rib",
      capital: 'مأرب',
      capitalEn: "Ma'rib",
      population: 300000,
      area: 31192,
      coordinates: { lat: 15.4625, lng: 45.3250, zoom: 9 },
    },
    {
      name: 'شبوة',
      nameEn: 'Shabwah',
      capital: 'عتق',
      capitalEn: 'Ataq',
      population: 570000,
      area: 47728,
      coordinates: { lat: 14.5361, lng: 46.8317, zoom: 9 },
    },
    {
      name: 'لحج',
      nameEn: 'Lahij',
      capital: 'الحوطة',
      capitalEn: 'Al Hawtah',
      population: 920000,
      area: 12766,
      coordinates: { lat: 13.0567, lng: 44.8811, zoom: 10 },
    },
    {
      name: 'أبين',
      nameEn: 'Abyan',
      capital: 'زنجبار',
      capitalEn: 'Zinjibar',
      population: 510000,
      area: 16859,
      coordinates: { lat: 13.1261, lng: 45.3761, zoom: 10 },
    },
    {
      name: 'الضالع',
      nameEn: 'Ad Dali',
      capital: 'الضالع',
      capitalEn: 'Ad Dali',
      population: 580000,
      area: 4864,
      coordinates: { lat: 13.6950, lng: 44.7317, zoom: 11 },
    },
    {
      name: 'البيضاء',
      nameEn: 'Al Bayda',
      capital: 'البيضاء',
      capitalEn: 'Al Bayda',
      population: 720000,
      area: 10465,
      coordinates: { lat: 14.2750, lng: 45.5722, zoom: 10 },
    },
    {
      name: 'ريمة',
      nameEn: 'Raymah',
      capital: 'الجبين',
      capitalEn: 'Al Jabin',
      population: 480000,
      area: 2442,
      coordinates: { lat: 14.6106, lng: 43.8083, zoom: 11 },
    },
    {
      name: 'المهرة',
      nameEn: 'Al Mahrah',
      capital: 'الغيضة',
      capitalEn: 'Al Ghaydah',
      population: 120000,
      area: 82405,
      coordinates: { lat: 16.7019, lng: 51.8319, zoom: 8 },
    },
    {
      name: 'سقطرى',
      nameEn: 'Socotra',
      capital: 'حديبو',
      capitalEn: 'Hadibu',
      population: 60000,
      area: 3654,
      coordinates: { lat: 12.4634, lng: 53.8237, zoom: 10 },
    },
  ];

  for (const gov of governorates) {
    await prisma.governorate.upsert({
      where: { name: gov.name },
      update: {},
      create: gov,
    });
  }
  console.log('✅ تم إنشاء المحافظات اليمنية');

  // =============================================
  // 4. إنشاء إعدادات الموقع الأساسية
  // =============================================
  console.log('⚙️ إنشاء إعدادات الموقع...');
  
  const settings = [
    {
      key: 'site_name',
      value: 'يمنبيديا - موسوعة اليمن الوطنية',
      type: 'text',
      group: 'general',
      description: 'اسم الموقع',
    },
    {
      key: 'site_name_en',
      value: 'Yemenpedia - Yemen National Encyclopedia',
      type: 'text',
      group: 'general',
      description: 'Site name in English',
    },
    {
      key: 'site_description',
      value: 'الموسوعة الوطنية لليمن - مرجع شامل للتاريخ والجغرافيا والثقافة والتراث اليمني',
      type: 'text',
      group: 'general',
      description: 'وصف الموقع',
    },
    {
      key: 'site_keywords',
      value: 'يمن, اليمن, موسوعة, تاريخ, جغرافيا, ثقافة, تراث, Yemen, encyclopedia',
      type: 'text',
      group: 'general',
      description: 'الكلمات المفتاحية',
    },
    {
      key: 'contact_email',
      value: 'info@yemenpedia.org',
      type: 'text',
      group: 'contact',
      description: 'البريد الإلكتروني للتواصل',
    },
    {
      key: 'primary_color',
      value: '#CE1126',
      type: 'text',
      group: 'appearance',
      description: 'اللون الأساسي (أحمر العلم اليمني)',
    },
    {
      key: 'secondary_color',
      value: '#000000',
      type: 'text',
      group: 'appearance',
      description: 'اللون الثانوي (أسود العلم اليمني)',
    },
    {
      key: 'accent_color',
    value: '#FFFFFF',
      type: 'text',
      group: 'appearance',
      description: 'لون التمييز (أبيض العلم اليمني)',
    },
    {
      key: 'articles_per_page',
      value: '12',
      type: 'number',
      group: 'content',
      description: 'عدد المقالات في الصفحة',
    },
    {
      key: 'enable_registration',
      value: 'true',
      type: 'boolean',
      group: 'users',
      description: 'تفعيل التسجيل',
    },
    {
      key: 'require_email_verification',
      value: 'true',
      type: 'boolean',
      group: 'users',
      description: 'طلب تحقق البريد الإلكتروني',
    },
    {
      key: 'default_language',
      value: 'ar',
      type: 'text',
      group: 'localization',
      description: 'اللغة الافتراضية',
    },
    {
      key: 'enable_english',
      value: 'true',
      type: 'boolean',
      group: 'localization',
      description: 'تفعيل الإنجليزية',
    },
    {
      key: 'social_facebook',
      value: 'https://facebook.com/yemenpedia',
      type: 'text',
      group: 'social',
      description: 'رابط فيسبوك',
    },
    {
      key: 'social_twitter',
      value: 'https://twitter.com/yemenpedia',
      type: 'text',
      group: 'social',
      description: 'رابط تويتر',
    },
    {
      key: 'social_youtube',
      value: 'https://youtube.com/yemenpedia',
      type: 'text',
      group: 'social',
      description: 'رابط يوتيوب',
    },
    {
      key: 'welcome_message',
      value: 'مرحباً بك في يمنبيديا، الموسوعة الوطنية لليمن. سجل الآن وكن جزءاً من توثيق تاريخ وحضارة اليمن.',
      type: 'text',
      group: 'content',
      description: 'رسالة الترحيب',
    },
    {
      key: 'points_per_article',
      value: '10',
      type: 'number',
      group: 'gamification',
      description: 'نقاط لكل مقال منشور',
    },
    {
      key: 'points_per_comment',
      value: '2',
      type: 'number',
      group: 'gamification',
      description: 'نقاط لكل تعليق',
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('✅ تم إنشاء إعدادات الموقع');

  // =============================================
  // 5. إنشاء بعض الوسوم الأساسية
  // =============================================
  console.log('🏷️ إنشاء الوسوم الأساسية...');
  
  const tags = [
    { name: 'حضارة', nameEn: 'Civilization', slug: 'civilization' },
    { name: 'تراث', nameEn: 'Heritage', slug: 'heritage' },
    { name: 'تاريخ قديم', nameEn: 'Ancient History', slug: 'ancient-history' },
    { name: 'تاريخ إسلامي', nameEn: 'Islamic History', slug: 'islamic-history' },
    { name: 'معمار', nameEn: 'Architecture', slug: 'architecture' },
    { name: 'شعر', nameEn: 'Poetry', slug: 'poetry' },
    { name: 'علوم', nameEn: 'Sciences', slug: 'sciences-tag' },
    { name: 'تجارة', nameEn: 'Trade', slug: 'trade' },
    { name: 'زراعة', nameEn: 'Agriculture', slug: 'agriculture' },
    { name: 'سياحة', nameEn: 'Tourism', slug: 'tourism' },
    { name: 'صنعاء القديمة', nameEn: 'Old Sanaa', slug: 'old-sanaa' },
    { name: 'سقطرى', nameEn: 'Socotra', slug: 'socotra-tag' },
    { name: 'سبأ', nameEn: 'Sheba', slug: 'sheba' },
    { name: 'حمير', nameEn: 'Himyar', slug: 'himyar' },
    { name: 'اليمن السعيد', nameEn: 'Happy Yemen', slug: 'happy-yemen' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }
  console.log('✅ تم إنشاء الوسوم الأساسية');

  // =============================================
  // 6. إضافة إشعار ترحيب للمدير
  // =============================================
  await prisma.notification.create({
    data: {
      userId: adminUser.id,
      type: 'WELCOME',
      title: 'مرحباً بك في يمنبيديا!',
      message: 'تم إنشاء حسابك الإداري بنجاح. يمكنك الآن البدء في إدارة الموسوعة وإضافة المحتوى.',
    },
  });

  console.log('\n🎉 تم زرع البيانات بنجاح!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 البريد الإلكتروني: admin@yemenpedia.org');
  console.log('🔑 كلمة المرور: admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 الإحصائيات:');
  console.log(`   - الأقسام: ${categories.length}`);
  console.log(`   - المحافظات: ${governorates.length}`);
  console.log(`   - الإعدادات: ${settings.length}`);
  console.log(`   - الوسوم: ${tags.length}`);
}

main()
  .catch((e) => {
    console.error('❌ خطأ في زرع البيانات:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
