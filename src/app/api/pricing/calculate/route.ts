import { NextRequest, NextResponse } from 'next/server'
import {
  calculateAutoPrice,
  calculateHomePrice,
} from '@/lib/pricing-engine'
import type {
  VehicleClass,
  AutoServiceType,
  AutoCondition,
  AutoConditionAddon,
  HomeFloorplan,
  HomeServiceType,
  HomeDirtiness,
  HomeLastCleaned,
} from '@/lib/pricing-engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category } = body

    if (!category) {
      return NextResponse.json(
        { error: 'Missing category' },
        { status: 400 }
      )
    }

    if (category === 'auto_care') {
      const {
        vehicle_class,
        auto_service_type,
        auto_condition,
        condition_addons = [],
      } = body

      if (!vehicle_class || !auto_service_type || !auto_condition) {
        return NextResponse.json(
          { error: 'Missing vehicle_class, auto_service_type, or auto_condition' },
          { status: 400 }
        )
      }

      const result = calculateAutoPrice({
        vehicleClass: vehicle_class as VehicleClass,
        serviceType: auto_service_type as AutoServiceType,
        condition: auto_condition as AutoCondition,
        conditionAddons: condition_addons as AutoConditionAddon[],
      })

      return NextResponse.json(result)
    }

    if (category === 'home_care') {
      const {
        floorplan,
        sqft,
        home_service_type,
        home_dirtiness,
        last_cleaned,
      } = body

      if ((!floorplan && !sqft) || !home_service_type || !home_dirtiness || !last_cleaned) {
        return NextResponse.json(
          { error: 'Missing floorplan/sqft, home_service_type, home_dirtiness, or last_cleaned' },
          { status: 400 }
        )
      }

      const result = calculateHomePrice({
        floorplan: floorplan ? (floorplan as HomeFloorplan) : undefined,
        sqft: sqft ? Number(sqft) : undefined,
        serviceType: home_service_type as HomeServiceType,
        dirtiness: home_dirtiness as HomeDirtiness,
        lastCleaned: last_cleaned as HomeLastCleaned,
      })

      return NextResponse.json(result)
    }

    return NextResponse.json(
      { error: 'Unsupported category' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Pricing calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate pricing' },
      { status: 500 }
    )
  }
}
