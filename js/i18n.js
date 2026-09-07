/* ==========================================================================
   INVOICEGEN MULTI-LANGUAGE (i18n) ENGINE
   Supports: English (en), Bengali (bn), Spanish (es), French (fr),
             German (de), Arabic (ar), Hindi (hi), Chinese (zh)
   ========================================================================== */

(function () {
  'use strict';

  const LANGUAGES = {
    en: { name: 'English', native: 'English', flag: '🇺🇸', dir: 'ltr' },
    bn: { name: 'Bengali', native: 'বাংলা', flag: '🇧🇩', dir: 'ltr' },
    es: { name: 'Spanish', native: 'Español', flag: '🇪🇸', dir: 'ltr' },
    fr: { name: 'French', native: 'Français', flag: '🇫🇷', dir: 'ltr' },
    de: { name: 'German', native: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
    ar: { name: 'Arabic', native: 'العربية', flag: '🇸🇦', dir: 'rtl' },
    hi: { name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
    zh: { name: 'Chinese', native: '中文', flag: '🇨🇳', dir: 'ltr' }
  };

  const TRANSLATIONS = {
    // Navigation
    nav_generator: {
      en: 'Invoice Generator',
      bn: 'ইনভয়েস জেনারেটর',
      es: 'Generador de Facturas',
      fr: 'Générateur de Factures',
      de: 'Rechnungs-Generator',
      ar: 'مولد الفواتير',
      hi: 'इनवॉइस जेनरेटर',
      zh: '发票生成器'
    },
    nav_templates: {
      en: 'Templates',
      bn: 'টেমপ্লেট',
      es: 'Plantillas',
      fr: 'Modèles',
      de: 'Vorlagen',
      ar: 'النماذج',
      hi: 'टेम्पलेट्स',
      zh: '模板库'
    },
    nav_features: {
      en: 'Features',
      bn: 'ফিচারসমূহ',
      es: 'Características',
      fr: 'Fonctionnalités',
      de: 'Funktionen',
      ar: 'المميزات',
      hi: 'सुविधाएं',
      zh: '平台功能'
    },
    nav_pricing: {
      en: 'Pricing',
      bn: 'প্রাইসিং',
      es: 'Precios',
      fr: 'Tarifs',
      de: 'Preise',
      ar: 'الأسعار',
      hi: 'मूल्य निर्धारण',
      zh: '价格方案'
    },
    btn_login: {
      en: 'Log In',
      bn: 'লগইন',
      es: 'Iniciar Sesión',
      fr: 'Connexion',
      de: 'Anmelden',
      ar: 'تسجيل الدخول',
      hi: 'लॉग इन',
      zh: '登录'
    },
    btn_signup: {
      en: 'Sign Up Free',
      bn: 'ফ্রি সাইন আপ',
      es: 'Registrarse Gratis',
      fr: 'Inscription Gratuite',
      de: 'Kostenlos Registrieren',
      ar: 'تسجيل مجاني',
      hi: 'साइन अप फ्री',
      zh: '免费注册'
    },
    my_account: {
      en: 'My Account',
      bn: 'আমার অ্যাকাউন্ট',
      es: 'Mi Cuenta',
      fr: 'Mon Compte',
      de: 'Mein Konto',
      ar: 'حسابي',
      hi: 'मेरा खाता',
      zh: '我的账户'
    },
    btn_signout: {
      en: 'Sign Out',
      bn: 'সাইন আউট',
      es: 'Cerrar Sesión',
      fr: 'Déconnexion',
      de: 'Abmelden',
      ar: 'تسجيل الخروج',
      hi: 'साइन आउट',
      zh: '退出登录'
    },

    // Generator Page
    gen_hero_title: {
      en: 'Free Online Invoice Generator',
      bn: 'ফ্রি অনলাইন ইনভয়েস জেনারেটর',
      es: 'Generador de Facturas Online Gratis',
      fr: 'Générateur de Factures en Ligne Gratuit',
      de: 'Kostenloser Online-Rechnungsgenerator',
      ar: 'مولد فواتير مجاني عبر الإنترنت',
      hi: 'मुफ़्त ऑनलाइन इनवॉइस जेनरेटर',
      zh: '免费在线发票生成器'
    },
    gen_hero_sub: {
      en: 'Create, customize, and download pixel-perfect PDF invoices in seconds. 100% private and client-side.',
      bn: 'সেকেন্ডে তৈরি করুন ও ডাউনলোড করুন প্রফেশনাল ভেক্টর PDF ইনভয়েস। ১০০% নিরাপদ ও ক্লায়েন্ট-সাইড।',
      es: 'Cree, personalice y descargue facturas en PDF en segundos. 100% privado y seguro.',
      fr: 'Créez, personnalisez et téléchargez des factures PDF professionnelles en quelques secondes.',
      de: 'Erstellen, anpassen und herunterladen von perfekten PDF-Rechnungen in Sekunden.',
      ar: 'إنشاء وتخصيص وتنزيل فواتير PDF احترافية في ثوانٍ. خاص وآمن بنسبة 100٪.',
      hi: 'सेकंडों में पेशेवर पीडीएफ इनवॉइस बनाएं और डाउनलोड करें। 100% सुरक्षित।',
      zh: '数秒内创建、定制并导出高质量PDF发票。100%离线隐私安全。'
    },
    doc_currency: {
      en: 'Currency & Language',
      bn: 'মুদ্রা ও ভাষা',
      es: 'Moneda e Idioma',
      fr: 'Devise et Langue',
      de: 'Währung & Sprache',
      ar: 'العملة واللغة',
      hi: 'मुद्रा और भाषा',
      zh: '币种与语言'
    },
    doc_fields_title: {
      en: 'Customize Document Fields',
      bn: 'ডকুমেন্ট ফিল্ড কাস্টমাইজ করুন',
      es: 'Personalizar Campos',
      fr: 'Personnaliser les Champs',
      de: 'Dokumentfelder anpassen',
      ar: 'تخصيص حقول الفاتورة',
      hi: 'दस्तावेज़ फ़ील्ड अनुकूलित करें',
      zh: '自定义单据字段'
    },
    opt_shipping: {
      en: 'Show Shipping Details',
      bn: 'শিপিং বিবরণ প্রদর্শন করুন',
      es: 'Mostrar Detalles de Envío',
      fr: 'Afficher les Détails de Livraison',
      de: 'Versanddetails anzeigen',
      ar: 'إظهار تفاصيل الشحن',
      hi: 'शिपिंग विवरण दिखाएं',
      zh: '显示物流配送详情'
    },
    opt_ponumber: {
      en: 'Show P.O. Number',
      bn: 'পি.ও. নম্বর প্রদর্শন করুন',
      es: 'Mostrar Número de Orden (P.O.)',
      fr: 'Afficher le N° de Commande',
      de: 'Bestellnummer (P.O.) anzeigen',
      ar: 'إظهار رقم أمر الشراء',
      hi: 'पी.ओ. संख्या दिखाएं',
      zh: '显示采购订单号 (P.O.)'
    },
    opt_duedate: {
      en: 'Show Due Date',
      bn: 'পরিশোধের শেষ তারিখ প্রদর্শন করুন',
      es: 'Mostrar Fecha de Vencimiento',
      fr: 'Afficher la Date d’Échéance',
      de: 'Fälligkeitsdatum anzeigen',
      ar: 'إظهار تاريخ الاستحقاق',
      hi: 'देय तिथि दिखाएं',
      zh: '显示截止还款日期'
    },
    opt_discount: {
      en: 'Show Discount (% off)',
      bn: 'ডিসকাউন্ট প্রদর্শন করুন (% off)',
      es: 'Mostrar Descuento (%)',
      fr: 'Afficher la Remise (%)',
      de: 'Rabatt anzeigen (%)',
      ar: 'إظهار الخصم (%)',
      hi: 'छूट दिखाएं (%)',
      zh: '显示折扣优惠 (%)'
    },
    opt_signature: {
      en: 'Show Signature Line',
      bn: 'স্বাক্ষরের স্থান প্রদর্শন করুন',
      es: 'Mostrar Línea de Firma',
      fr: 'Afficher la Ligne de Signature',
      de: 'Unterschriftenzeile anzeigen',
      ar: 'إظهار سطر التوقيع',
      hi: 'हस्ताक्षर पंक्ति दिखाएं',
      zh: '显示签名签署栏'
    },
    btn_download_pdf: {
      en: 'Download PDF',
      bn: 'PDF ডাউনলোড',
      es: 'Descargar PDF',
      fr: 'Télécharger PDF',
      de: 'PDF Herunterladen',
      ar: 'تحميل PDF',
      hi: 'पीडीएफ डाउनलोड',
      zh: '下载 PDF'
    },
    btn_print: {
      en: 'Print Invoice',
      bn: 'ইনভয়েস প্রিন্ট',
      es: 'Imprimir Factura',
      fr: 'Imprimer Facture',
      de: 'Rechnung Drucken',
      ar: 'طباعة الفاتورة',
      hi: 'इनवॉइस प्रिंट करें',
      zh: '打印发票'
    },
    btn_send_email: {
      en: 'Send via Email',
      bn: 'ইমেইলে পাঠান',
      es: 'Enviar por Email',
      fr: 'Envoyer par Email',
      de: 'Per E-Mail senden',
      ar: 'إرسال بالبريد',
      hi: 'ईमेल से भेजें',
      zh: '邮件发送'
    },
    btn_sample_demo: {
      en: 'Demo Sample',
      bn: 'নমুনা ডেমো',
      es: 'Datos de Prueba',
      fr: 'Exemple Démo',
      de: 'Beispiel-Demo',
      ar: 'نموذج تجريبي',
      hi: 'डेमो नमूना',
      zh: '加载示例数据'
    },
    btn_reset_form: {
      en: 'Reset Form',
      bn: 'ফর্ম রিসেট',
      es: 'Reiniciar Formulario',
      fr: 'Réinitialiser',
      de: 'Zurücksetzen',
      ar: 'إعادة تعيين',
      hi: 'रीसेट फॉर्म',
      zh: '清空重置'
    },
    btn_add_item: {
      en: '+ Add Line Item',
      bn: '+ নতুন আইটেম যোগ করুন',
      es: '+ Agregar Artículo',
      fr: '+ Ajouter une Ligne',
      de: '+ Position Hinzufügen',
      ar: '+ إضافة عنصر',
      hi: '+ नया आइटम जोड़ें',
      zh: '+ 添加商品明细'
    },

    // Invoice Form Fields
    lbl_invoice: {
      en: 'INVOICE',
      bn: 'ইনভয়েস',
      es: 'FACTURA',
      fr: 'FACTURE',
      de: 'RECHNUNG',
      ar: 'فاتورة',
      hi: 'इनवॉइस',
      zh: '发票账单'
    },
    lbl_invoice_no: {
      en: 'Invoice #',
      bn: 'ইনভয়েস নং',
      es: 'Factura N°',
      fr: 'Facture N°',
      de: 'Rechnung Nr.',
      ar: 'رقم الفاتورة',
      hi: 'इनवॉइस सं.',
      zh: '发票编号 #'
    },
    lbl_invoice_date: {
      en: 'Invoice Date',
      bn: 'ইনভয়েস তারিখ',
      es: 'Fecha de Emisión',
      fr: 'Date de Facturation',
      de: 'Rechnungsdatum',
      ar: 'تاريخ الفاتورة',
      hi: 'इनवॉइस तिथि',
      zh: '开票日期'
    },
    lbl_due_date: {
      en: 'Due Date',
      bn: 'পরিশোধের তারিখ',
      es: 'Fecha de Vencimiento',
      fr: 'Date d’Échéance',
      de: 'Fälligkeitsdatum',
      ar: 'تاريخ الاستحقاق',
      hi: 'देय तिथि',
      zh: '截止还款日'
    },
    lbl_po_number: {
      en: 'P.O. Number',
      bn: 'পি.ও. নম্বর',
      es: 'N° de Orden (P.O.)',
      fr: 'N° de Commande',
      de: 'Bestellnummer',
      ar: 'رقم أمر الشراء',
      hi: 'पी.ओ. संख्या',
      zh: '采购订单号'
    },
    lbl_from: {
      en: 'From (Your Details)',
      bn: 'প্রেরক (আপনার তথ্য)',
      es: 'De (Sus Datos)',
      fr: 'De (Vos Coordonnées)',
      de: 'Von (Ihre Angaben)',
      ar: 'من (بياناتك)',
      hi: 'प्रेषक (आपका विवरण)',
      zh: '开票方（您的信息）'
    },
    lbl_bill_to: {
      en: 'Bill To (Client Details)',
      bn: 'প্রাপক (ক্লায়েন্টের তথ্য)',
      es: 'Facturar A (Cliente)',
      fr: 'Facturer À (Client)',
      de: 'Rechnungsempfänger',
      ar: 'فاتورة إلى (العميل)',
      hi: 'बिल प्राप्तकर्ता (ग्राहक)',
      zh: '付款方（客户信息）'
    },
    lbl_ship_to: {
      en: 'Ship To (Delivery Details)',
      bn: 'শিপিং ঠিকানা (ডেলিভারি)',
      es: 'Enviar A (Dirección)',
      fr: 'Livrer À (Adresse)',
      de: 'Lieferadresse',
      ar: 'شحن إلى (العنوان)',
      hi: 'शिपिंग पता (वितरण)',
      zh: '收件方（配送地址）'
    },
    tbl_item: {
      en: 'Item Description',
      bn: 'আইটেমের বিবরণ',
      es: 'Descripción del Artículo',
      fr: 'Description de l’Article',
      de: 'Artikelbeschreibung',
      ar: 'وصف العنصر',
      hi: 'मद विवरण',
      zh: '商品/服务描述'
    },
    tbl_qty: {
      en: 'Qty',
      bn: 'পরিমাণ',
      es: 'Cant.',
      fr: 'Qté',
      de: 'Menge',
      ar: 'الكمية',
      hi: 'मात्रा',
      zh: '数量'
    },
    tbl_rate: {
      en: 'Rate',
      bn: 'মূল্য',
      es: 'Precio',
      fr: 'Prix Unitaire',
      de: 'Preis',
      ar: 'السعر',
      hi: 'दर',
      zh: '单价'
    },
    tbl_amount: {
      en: 'Amount',
      bn: 'মোট',
      es: 'Total',
      fr: 'Montant',
      de: 'Gesamt',
      ar: 'المبلغ',
      hi: 'राशि',
      zh: '金额'
    },
    lbl_subtotal: {
      en: 'Subtotal',
      bn: 'সাবটোটাল',
      es: 'Subtotal',
      fr: 'Sous-total',
      de: 'Zwischensumme',
      ar: 'المجموع الفرعي',
      hi: 'उप-योग',
      zh: '小计金额'
    },
    lbl_tax: {
      en: 'Tax',
      bn: 'ট্যাক্স / ভ্যাট',
      es: 'Impuesto (IVA)',
      fr: 'Taxe (TVA)',
      de: 'Steuer (MwSt.)',
      ar: 'الضريبة (VAT)',
      hi: 'कर (जीएसटी)',
      zh: '税金 (VAT)'
    },
    lbl_total: {
      en: 'Total',
      bn: 'সর্বমোট',
      es: 'Total',
      fr: 'Total',
      de: 'Gesamtbetrag',
      ar: 'الإجمالي',
      hi: 'कुल योग',
      zh: '合计总额'
    },
    lbl_amount_paid: {
      en: 'Amount Paid',
      bn: 'পরিশোধিত অর্থ',
      es: 'Monto Pagado',
      fr: 'Montant Payé',
      de: 'Bezahlter Betrag',
      ar: 'المبلغ المدفوع',
      hi: 'भुगतान की गई राशि',
      zh: '已付款额'
    },
    lbl_balance_due: {
      en: 'Balance Due',
      bn: 'অবশিষ্ট বকেয়া',
      es: 'Saldo Pendiente',
      fr: 'Solde Dû',
      de: 'Restbetrag',
      ar: 'الرصيد المستحق',
      hi: 'शेष देय राशि',
      zh: '应付余款'
    },
    lbl_notes: {
      en: 'Notes / Payment Instructions',
      bn: 'নোট ও পেমেন্ট নির্দেশনা',
      es: 'Notas e Instrucciones de Pago',
      fr: 'Notes et Instructions de Paiement',
      de: 'Hinweise & Zahlungsanweisungen',
      ar: 'ملاحظات وتعليمات الدفع',
      hi: 'नोट्स और भुगतान निर्देश',
      zh: '备注与收款指引'
    },
    lbl_terms: {
      en: 'Terms & Conditions',
      bn: 'শর্তাবলী ও নিয়মাবলি',
      es: 'Términos y Condiciones',
      fr: 'Conditions Générales',
      de: 'Geschäftsbedingungen',
      ar: 'الشروط والأحكام',
      hi: 'नियम और शर्तें',
      zh: '交易条款与约定'
    },

    // Templates Page
    tpl_title: {
      en: 'Invoice Templates',
      bn: 'ইনভয়েস টেমপ্লেটসমূহ',
      es: 'Plantillas de Facturas',
      fr: 'Modèles de Factures',
      de: 'Rechnungsvorlagen',
      ar: 'نماذج الفواتير',
      hi: 'इनवॉइस टेम्पलेट्स',
      zh: '精选发票模板'
    },
    tpl_sub: {
      en: 'Choose a design to start generating professional invoices.',
      bn: 'পছন্দের ডিজাইন নির্বাচন করে প্রফেশনাল ইনভয়েস তৈরি শুরু করুন।',
      es: 'Elija un diseño para comenzar a generar facturas profesionales.',
      fr: 'Choisissez un modèle pour générer vos factures professionnelles.',
      de: 'Wählen Sie ein Design, um professionelle Rechnungen zu erstellen.',
      ar: 'اختر تصميماً للبدء في إنشاء فواتير احترافية.',
      hi: 'पेशेवर इनवॉइस बनाने के लिए एक डिज़ाइन चुनें।',
      zh: '选择一款精美设计，即刻开始生成专业发票。'
    },
    filter_all: {
      en: 'All Templates',
      bn: 'সব টেমপ্লেট',
      es: 'Todas las Plantillas',
      fr: 'Tous les Modèles',
      de: 'Alle Vorlagen',
      ar: 'جميع النماذج',
      hi: 'सभी टेम्पलेट्स',
      zh: '全部模板'
    },
    filter_free: {
      en: '100% Free Classic',
      bn: '১০০% ফ্রি ক্লাসিক',
      es: '100% Gratis Clásico',
      fr: '100% Gratuit Classique',
      de: '100% Kostenlos Klassisch',
      ar: 'كلاسيكي مجاني 100٪',
      hi: '100% मुफ्त क्लासिक',
      zh: '100%免费经典版'
    },
    filter_pro: {
      en: 'Pro Business',
      bn: 'প্রো বিজনেস',
      es: 'Pro Empresarial',
      fr: 'Pro Entreprise',
      de: 'Pro Business',
      ar: 'برو للأعمال',
      hi: 'प्रो बिजनेस',
      zh: 'Pro专业商务'
    },
    btn_use_tpl: {
      en: 'Use Template →',
      bn: 'টেমপ্লেট ব্যবহার করুন →',
      es: 'Usar Plantilla →',
      fr: 'Utiliser ce Modèle →',
      de: 'Vorlage Verwenden →',
      ar: 'استخدام النموذج ←',
      hi: 'टेम्पलेट का उपयोग करें →',
      zh: '使用该模板 →'
    },
    btn_use_tpl_locked: {
      en: 'Use Template (Pro)',
      bn: 'টেমপ্লেট ব্যবহার (প্রো)',
      es: 'Usar Plantilla (Pro)',
      fr: 'Utiliser ce Modèle (Pro)',
      de: 'Vorlage Verwenden (Pro)',
      ar: 'استخدام النموذج (Pro)',
      hi: 'टेम्पलेट का उपयोग करें (Pro)',
      zh: '解锁该模板 (Pro)'
    },

    // Pricing Page
    pricing_hero_title: {
      en: 'Simple, Transparent Pricing',
      bn: 'সহজ ও স্বচ্ছ প্রাইসিং প্ল্যান',
      es: 'Precios Simples y Transparentes',
      fr: 'Tarifs Simples et Transparents',
      de: 'Einfache & Transparente Preise',
      ar: 'أسعار بسيطة وشفافة',
      hi: 'सरल और पारदर्शी मूल्य निर्धारण',
      zh: '简单透明的价格方案'
    },
    pricing_hero_sub: {
      en: 'Start free, upgrade to Pro for just $5/month, or own everything forever for $70.',
      bn: 'ফ্রিতে শুরু করুন, মাসে মাত্র ৫$ এ প্রো নিন অথবা ৭০$ এ লাইফটাইম আনলক করুন।',
      es: 'Comience gratis, actualice a Pro por $5/mes o adquiéralo para siempre por $70.',
      fr: 'Commencez gratuitement, passez à Pro pour 5 $/mois ou accédez à vie pour 70 $.',
      de: 'Kostenlos starten, Upgrade auf Pro für 5 $/Monat oder Lifetime für 70 $.',
      ar: 'ابدأ مجاناً، قم بالترقية إلى برو مقابل 5 دولارات شهرياً، أو امتلك كل شيء للأبد مقابل 70 دولاراً.',
      hi: 'मुफ़्त शुरू करें, $5/माह में प्रो में अपग्रेड करें, या $70 में हमेशा के लिए सब कुछ पाएं।',
      zh: '免费开启，每月仅需$5升级Pro，或只需$70永久买断畅享全部特权。'
    },
    btn_monthly: {
      en: 'Monthly Billing',
      bn: 'মাসিক বিলিং',
      es: 'Facturación Mensual',
      fr: 'Facturation Mensuelle',
      de: 'Monatliche Abrechnung',
      ar: 'فاتورة شهرية',
      hi: 'मासिक बिलिंग',
      zh: '按月订购'
    },
    btn_lifetime: {
      en: 'Lifetime Deal',
      bn: 'লাইফটাইম ডিল',
      es: 'Oferta de Por Vida',
      fr: 'Offre à Vie',
      de: 'Lifetime-Angebot',
      ar: 'عرض مدى الحياة',
      hi: 'लाइफटाइम डील',
      zh: '终生永久买断'
    },
    save_80: {
      en: 'Pay Once • Save 80%',
      bn: 'একবার দিন • ৮০% সাশ্রয়',
      es: 'Pago Único • Ahorra 80%',
      fr: 'Paiement Unique • Économisez 80 %',
      de: 'Einmal zahlen • 80 % sparen',
      ar: 'ادفع مرة واحدة • وفر 80٪',
      hi: 'एक बार भुगतान • 80% बचत',
      zh: '一次付款 • 立省 80%'
    },
    plan_starter: {
      en: 'Starter Plan',
      bn: 'স্টার্টার প্ল্যান',
      es: 'Plan Inicial',
      fr: 'Plan Débutant',
      de: 'Starter-Plan',
      ar: 'خطة البداية',
      hi: 'स्टार्टर प्लान',
      zh: '新手启航版'
    },
    plan_pro: {
      en: 'Pro Plan',
      bn: 'প্রো প্ল্যান',
      es: 'Plan Pro',
      fr: 'Plan Pro',
      de: 'Pro-Plan',
      ar: 'خطة برو',
      hi: 'प्रो प्लान',
      zh: 'Pro专业版'
    },
    plan_lifetime: {
      en: 'Lifetime Plan',
      bn: 'লাইফটাইম প্ল্যান',
      es: 'Plan de Por Vida',
      fr: 'Plan à Vie',
      de: 'Lifetime-Plan',
      ar: 'خطة مدى الحياة',
      hi: 'लाइफटाइम प्लान',
      zh: '终生尊享版'
    },
    choose_plan: {
      en: 'Choose Plan',
      bn: 'প্ল্যান নির্বাচন করুন',
      es: 'Elegir Plan',
      fr: 'Choisir ce Plan',
      de: 'Plan Wählen',
      ar: 'اختيار الخطة',
      hi: 'प्लान चुनें',
      zh: '立即选购'
    },

    // Auth Pages
    auth_welcome_home: {
      en: 'Welcome home',
      bn: 'স্বাগতম',
      es: 'Bienvenido',
      fr: 'Bienvenue',
      de: 'Willkommen zurück',
      ar: 'مرحباً بك',
      hi: 'स्वागत है',
      zh: '欢迎归来'
    },
    auth_login_sub: {
      en: 'Please enter your details to sign in.',
      bn: 'সাইন ইন করতে আপনার বিবরণ প্রদান করুন।',
      es: 'Ingrese sus datos para iniciar sesión.',
      fr: 'Veuillez saisir vos identifiants pour vous connecter.',
      de: 'Bitte geben Sie Ihre Daten ein, um sich anzumelden.',
      ar: 'الرجاء إدخال بياناتك لتسجيل الدخول.',
      hi: 'साइन इन करने के लिए अपना विवरण दर्ज करें।',
      zh: '请输入您的账号信息进行登录。'
    },
    auth_create_account: {
      en: 'Create your account',
      bn: 'নতুন অ্যাকাউন্ট তৈরি করুন',
      es: 'Crea tu cuenta',
      fr: 'Créez votre compte',
      de: 'Konto erstellen',
      ar: 'إنشاء حسابك',
      hi: 'अपना खाता बनाएं',
      zh: '创建您的账户'
    },
    auth_remember_me: {
      en: 'Remember for 30 days',
      bn: '৩০ দিনের জন্য মনে রাখুন',
      es: 'Recordar por 30 días',
      fr: 'Se souvenir de moi pendant 30 jours',
      de: '30 Tage lang angemeldet bleiben',
      ar: 'تذكرني لمدة 30 يوماً',
      hi: '30 दिनों के लिए याद रखें',
      zh: '30天内免登录'
    },
    auth_forgot_pass: {
      en: 'Forgot password?',
      bn: 'পাসওয়ার্ড ভুলে গেছেন?',
      es: '¿Olvidaste tu contraseña?',
      fr: 'Mot de passe oublié ?',
      de: 'Passwort vergessen?',
      ar: 'نسيت كلمة المرور؟',
      hi: 'पासवर्ड भूल गए?',
      zh: '忘记密码？'
    },
    auth_agree_terms: {
      en: 'I agree to the terms and Conditions',
      bn: 'আমি শর্তাবলী ও নিয়ম মেনে নিচ্ছি',
      es: 'Acepto los términos y condiciones',
      fr: 'J’accepte les conditions générales',
      de: 'Ich akzeptiere die AGB',
      ar: 'أوافق على الشروط والأحكام',
      hi: 'मैं नियमों और शर्तों से सहमत हूँ',
      zh: '我已阅读并同意服务条款'
    },

    // Footer
    footer_col_product: {
      en: 'Product',
      bn: 'প্রোডাক্ট',
      es: 'Producto',
      fr: 'Produit',
      de: 'Produkt',
      ar: 'المنتج',
      hi: 'उत्पाद',
      zh: '产品中心'
    },
    footer_col_about: {
      en: 'About Us',
      bn: 'আমাদের সম্পর্কে',
      es: 'Sobre Nosotros',
      fr: 'À Propos',
      de: 'Über Uns',
      ar: 'معلومات عنا',
      hi: 'हमारे बारे में',
      zh: '关于我们'
    },
    footer_col_legal: {
      en: 'Legal & Security',
      bn: 'লিগ্যাল ও নিরাপত্তা',
      es: 'Legal y Seguridad',
      fr: 'Légal & Sécurité',
      de: 'Rechtliches & Sicherheit',
      ar: 'القانونية والأمان',
      hi: 'कानूनी और सुरक्षा',
      zh: '法律与安全'
    },
    footer_col_blog: {
      en: 'Blog',
      bn: 'ব্লগ',
      es: 'Blog',
      fr: 'Blog',
      de: 'Blog',
      ar: 'المدونة',
      hi: 'ब्लॉग',
      zh: '官方博客'
    },
    footer_col_payments: {
      en: 'Payments & Gateway',
      bn: 'পেমেন্ট ও গেটওয়ে',
      es: 'Pagos y Pasarelas',
      fr: 'Paiements & Passerelles',
      de: 'Zahlungen & Gateways',
      ar: 'المدفوعات وبوابات الدفع',
      hi: 'भुगतान और गेटवे',
      zh: '支付与网关'
    },
    footer_tagline: {
      en: 'The modern, private, and effortless online invoice generator. Helping freelancers and businesses create professional invoices in seconds.',
      bn: 'আধুনিক, নিরাপদ ও সহজ অনলাইন ইনভয়েস জেনারেটর। ফ্রিল্যান্সার ও ব্যবসায়ীদের কয়েক সেকেন্ডে ইনভয়েস তৈরিতে সাহায্য করে।',
      es: 'El generador de facturas online moderno, privado y sin esfuerzo.',
      fr: 'Le générateur de factures en ligne moderne, privé et facile à utiliser.',
      de: 'Der moderne, private und mühelose Online-Rechnungsgenerator.',
      ar: 'مولد الفواتير الحديث والخاص والسهل عبر الإنترنت.',
      hi: 'आधुनिक, सुरक्षित और सरल ऑनलाइन इनवॉइस जेनरेटर।',
      zh: '现代、私密且高效的在线发票生成器，助力自由职业者与企业轻松开具发票。'
    },
    footer_status: {
      en: 'All Systems Operational • 100% Free',
      bn: 'সমস্ত সিস্টেম সচল • ১০০% ফ্রি',
      es: 'Todos los Sistemas Operativos • 100% Gratis',
      fr: 'Tous les Systèmes Sont Opérationnels • 100% Gratuit',
      de: 'Alle Systeme Betriebsbereit • 100% Kostenlos',
      ar: 'جميع الأنظمة تعمل بكفاءة • مجاني 100٪',
      hi: 'सभी सिस्टम सक्रिय हैं • 100% मुफ़्त',
      zh: '所有系统运转正常 • 100% 免费开源'
    }
  };

  // State
  let currentLang = 'en';

  function initLanguage() {
    try {
      const stored = localStorage.getItem('invoicegen_lang');
      if (stored && LANGUAGES[stored]) {
        currentLang = stored;
      } else {
        // Detect browser language if available
        const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
        for (const code of Object.keys(LANGUAGES)) {
          if (navLang.startsWith(code)) {
            currentLang = code;
            break;
          }
        }
      }
    } catch (e) {
      currentLang = 'en';
    }
    applyLanguage(currentLang);
  }

  function applyLanguage(lang) {
    if (!LANGUAGES[lang]) lang = 'en';
    currentLang = lang;

    try {
      localStorage.setItem('invoicegen_lang', lang);
    } catch (e) {}

    const meta = LANGUAGES[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;

    // Translate DOM text nodes
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (TRANSLATIONS[key] && TRANSLATIONS[key][lang]) {
        el.textContent = TRANSLATIONS[key][lang];
      }
    });

    // Translate Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (TRANSLATIONS[key] && TRANSLATIONS[key][lang]) {
        el.setAttribute('placeholder', TRANSLATIONS[key][lang]);
      }
    });

    // Update Language Switcher UI if rendered
    updateSwitcherUI();

    // Dispatch global event
    if (typeof CustomEvent === 'function' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang, meta } }));
      } catch (e) {}
    }
  }

  function updateSwitcherUI() {
    const toggles = document.querySelectorAll('.btn-lang-toggle');

    toggles.forEach(toggle => {
      const codeSpan = toggle.querySelector('.lang-code-text, .lang-current-code');
      if (codeSpan) codeSpan.textContent = currentLang.toUpperCase();
    });

    document.querySelectorAll('.lang-dropdown-item').forEach(item => {
      const langCode = item.getAttribute('data-lang');
      if (langCode === currentLang) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  function renderLanguageSwitcher() {
    // Generate dropdown HTML with clean, high-tech styling
    const optionsHtml = Object.entries(LANGUAGES).map(([code, data]) => `
      <button type="button" class="lang-dropdown-item ${code === currentLang ? 'active' : ''}" data-lang="${code}">
        <span class="lang-item-badge">${code.toUpperCase()}</span>
        <span class="lang-item-name">${data.native}</span>
        <span class="lang-item-en">${data.name}</span>
        <span class="lang-item-check">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </span>
      </button>
    `).join('');

    const switcherHtml = `
      <div class="lang-switcher-wrap" id="langSwitcherWrap">
        <button type="button" class="btn-lang-toggle btn-lang-pill" id="btnLangToggle" aria-haspopup="true" aria-expanded="false" title="Switch Language">
          <svg class="lang-globe-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span class="lang-code-text">${currentLang.toUpperCase()}</span>
          <svg class="lang-chevron-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <div class="lang-dropdown-menu" id="langDropdownMenu" role="menu">
          <div class="lang-dropdown-header">Language / ভাষা</div>
          <div class="lang-options-list">
            ${optionsHtml}
          </div>
        </div>
      </div>
    `;

    return switcherHtml;
  }

  function setupSwitcherEvents() {
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('.btn-lang-toggle');
      const item = e.target.closest('.lang-dropdown-item');
      const wrap = e.target.closest('.lang-switcher-wrap');

      if (toggle) {
        e.stopPropagation();
        const currentWrap = toggle.closest('.lang-switcher-wrap');
        const menu = currentWrap?.querySelector('.lang-dropdown-menu');
        const isOpen = menu?.classList.contains('active');
        
        // Close all other dropdowns
        document.querySelectorAll('.lang-dropdown-menu').forEach(m => m.classList.remove('active'));
        document.querySelectorAll('.btn-lang-toggle').forEach(t => t.setAttribute('aria-expanded', 'false'));

        if (!isOpen && menu) {
          menu.classList.add('active');
          toggle.setAttribute('aria-expanded', 'true');
        }
        return;
      }

      if (item) {
        e.stopPropagation();
        const code = item.getAttribute('data-lang');
        if (code && LANGUAGES[code]) {
          applyLanguage(code);
        }
        document.querySelectorAll('.lang-dropdown-menu').forEach(m => m.classList.remove('active'));
        document.querySelectorAll('.btn-lang-toggle').forEach(t => t.setAttribute('aria-expanded', 'false'));
        return;
      }

      // Click outside closes dropdown
      if (!wrap) {
        document.querySelectorAll('.lang-dropdown-menu').forEach(m => m.classList.remove('active'));
        document.querySelectorAll('.btn-lang-toggle').forEach(t => t.setAttribute('aria-expanded', 'false'));
      }
    });
  }

  function autoMountSwitchers() {
    document.querySelectorAll('.lang-switcher-container, #headerLangSwitcher, #mobileLangSwitcher').forEach(container => {
      if (!container.querySelector('.lang-switcher-wrap')) {
        container.innerHTML = renderLanguageSwitcher();
      }
    });
  }

  // Public API
  window.i18n = {
    languages: LANGUAGES,
    translations: TRANSLATIONS,
    getLanguage: () => currentLang,
    setLanguage: applyLanguage,
    t: (key) => (TRANSLATIONS[key] && TRANSLATIONS[key][currentLang]) ? TRANSLATIONS[key][currentLang] : (TRANSLATIONS[key] ? TRANSLATIONS[key].en : key),
    renderSwitcher: renderLanguageSwitcher,
    init: function () {
      autoMountSwitchers();
      initLanguage();
      setupSwitcherEvents();
    }
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.i18n.init);
  } else {
    window.i18n.init();
  }
})();

