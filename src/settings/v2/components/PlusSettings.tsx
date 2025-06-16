import { CopilotPlusWelcomeModal } from "@/components/modals/CopilotPlusWelcomeModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { PLUS_UTM_MEDIUMS } from "@/constants";
import { checkIsPlusUser, navigateToPlusPage, useIsPlusUser } from "@/plusUtils";
import { updateSetting, useSettingsValue } from "@/settings/model";
import { ExternalLink, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

export function PlusSettings() {
  const settings = useSettingsValue();
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const isPlusUser = true;
  const [localLicenseKey, setLocalLicenseKey] = useState(settings.plusLicenseKey);
  useEffect(() => {
    setLocalLicenseKey(settings.plusLicenseKey);
  }, [settings.plusLicenseKey]);

  return (
    <section className="tw-flex tw-flex-col tw-gap-4 tw-rounded-lg tw-bg-secondary tw-p-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-text-xl tw-font-bold">
        <span>Copilot Plus (已解锁本地功能)</span>
        <Badge variant="outline" className="tw-text-success">
          Active
        </Badge>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-2 tw-text-sm tw-text-muted">
        <div>Copilot Plus本地功能已解锁。您可以使用所有不需要服务器验证的高级功能。</div>
        <div>注意：需要服务器验证的功能（如网络搜索、PDF解析、YouTube解析等）将不可用。</div>
      </div>
      <div className="tw-text-error">{error}</div>
    </section>
  );
}
