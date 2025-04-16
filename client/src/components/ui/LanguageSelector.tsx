import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  useEffect(() => {
    // Update state if language changes from elsewhere
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const changeLanguage = (value: string) => {
    i18n.changeLanguage(value);
    setCurrentLanguage(value);
  };

  return (
    <div className="flex items-center space-x-2">
      <Select value={currentLanguage} onValueChange={changeLanguage}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('profile.language')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t('languages.en')}</SelectItem>
          <SelectItem value="es">{t('languages.es')}</SelectItem>
          <SelectItem value="de">{t('languages.de')}</SelectItem>
          <SelectItem value="fr">{t('languages.fr')}</SelectItem>
          <SelectItem value="ru">{t('languages.ru')}</SelectItem>
          <SelectItem value="ja">{t('languages.ja')}</SelectItem>
          <SelectItem value="ko">{t('languages.ko')}</SelectItem>
          <SelectItem value="th">{t('languages.th')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;