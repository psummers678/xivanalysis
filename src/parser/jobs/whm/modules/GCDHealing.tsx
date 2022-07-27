/* eslint-disable no-console */
/* eslint-disable no-trailing-spaces */
/* eslint-disable @typescript-eslint/quotes */
import {Trans} from "@lingui/macro"
import {ActionLink} from "components/ui/DbLink"
import Rotation from "components/ui/Rotation"
import {ActionKey, Action} from "data/ACTIONS"
import {Event, Events} from 'event'
import {Analyser} from "parser/core/Analyser"
import {filter} from 'parser/core/filter'
import {dependency} from "parser/core/Injectable"
import {Data} from "parser/core/modules/Data"
import React, {Fragment, ReactNode} from 'react'
import {Accordion} from "semantic-ui-react"

interface CastedHeal{
	casts: Array<Action['id']>
	heal: number,
	overheal: number,
	timestamp: number,
}

export class GCDHeals extends Analyser {

	static override handle = 'gcdHeals'
	static override title = 'GCD Healing'

	@dependency protected data !: Data

	private castHeals: CastedHeal[] = [];
	private trackedHeals: ActionKey[] = [
		'CURE',
		'CURE_II',
		'CURE_III',
		'MEDICA',
		'MEDICA_II',
		'REGEN',
	];

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(this.trackedHeals)), this.onCastedHeal)

		this.addEventHook('complete', this.onComplete)
	}

	private onCastedHeal(event: Events['action']) {
		console.log(event)
		this.castHeals.push({
			casts: [event.action],
			heal:1,
			overheal: 3,
			timestamp: event.timestamp,
		})
	}

	private onComplete() {
		console.log(this.castHeals)
	}

	override output(): ReactNode {
		const casts = this.castHeals.length
		if (casts === 0) {
			return <Fragment>
				<p><span><Trans id="whm.thinair.messages.no-casts">No casts recorded for <ActionLink {...this.data.actions.THIN_AIR}/></Trans></span></p>
			</Fragment>
		}

		const panels = this.castHeals.map(record => {
			return {
				key: record.timestamp,
				title: {
					content:
						<span>
							{this.parser.formatEpochTimestamp(record.timestamp)}
						</span>,
				},
				content: {
					content: <Rotation events={record.casts.map(x => ({action: x}))}/>,
				},
			}
		})

		const thinairDisplay = <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		></Accordion>

		return <Fragment>
			<p><Trans id="whm.thinair.messages.explanation">
				The main use of <ActionLink {...this.data.actions.THIN_AIR} /> should be to save MP on high MP-cost spells. Don't be afraid to hold it and lose a use over the fight as long as it covers an MP-heavy spell such as usages of <ActionLink {...this.data.actions.MEDICA_II}/>, <ActionLink {...this.data.actions.CURE_III}/>, and <ActionLink {...this.data.actions.RAISE} />. Usages that did not save a considerable amount of MP are marked red.
			</Trans></p>
			{thinairDisplay}
		</Fragment>
	}

}
