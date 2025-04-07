import { HTMLAttributes, useEffect, useState } from "react"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { Thermometer } from "lucide-react"

import { cn } from "@/lib/utils"
import { vscode } from "@/utils/vscode"
import { Mode, modes } from "../../../../src/shared/modes"
import { ModeTemperatureSettings as ModeTemperatureSettingsType } from "../../../../src/schemas"

import { SectionHeader } from "./SectionHeader"
import { Section } from "./Section"
import { ModeTemperatureControl } from "./ModeTemperatureControl"

type ModeTemperatureSettingsProps = HTMLAttributes<HTMLDivElement> & {
	modeTemperatures?: ModeTemperatureSettingsType
}

export const ModeTemperatureSettings = ({ className, modeTemperatures = {}, ...props }: ModeTemperatureSettingsProps) => {
	const { t } = useAppTranslation()
	const [temperatures, setTemperatures] = useState<ModeTemperatureSettingsType>(modeTemperatures)

	// Update local state when modeTemperatures prop changes
	useEffect(() => {
		setTemperatures(modeTemperatures)
	}, [modeTemperatures])

	const handleTemperatureChange = (mode: Mode, value: number | undefined | null) => {
		const newTemperatures = { ...temperatures, [mode]: value }
		setTemperatures(newTemperatures)

		// Send the updated temperatures to the extension
		vscode.postMessage({
			type: "setModeTemperature",
			mode,
			temperature: value
		})
	}

	return (
		<Section className={cn("flex flex-col gap-5", className)} {...props}>
			<SectionHeader description={t("settings:modeTemperature.description")}>
				<div className="flex items-center gap-2">
					<Thermometer className="w-4" />
					<div>{t("settings:modeTemperature.title")}</div>
				</div>
			</SectionHeader>

			<div className="flex flex-col gap-6">
				{modes.map((mode) => (
					<ModeTemperatureControl
						key={mode.slug}
						mode={mode.slug}
						value={temperatures[mode.slug]}
						onChange={handleTemperatureChange}
						maxValue={2}
					/>
				))}
			</div>
		</Section>
	)
}
