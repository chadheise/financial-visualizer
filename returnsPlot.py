import sys
import numpy as np
import matplotlib.pyplot as plt
import datetime as dt
import matplotlib.dates as mdates

from csvParsers import readSourceFile
from dateManipulation import *

def main(source_file):
    print("Reading source data...")
    entries = readSourceFile(source_file)

    # Ordered lists to use in plot
    seriesNames = ["Principle", "Balance", "Expected"]
    colors = ["red", "blue", "green"] 

    dates = [entry["date"] for entry in entries]

    ySeries = []
    principleSeries = createPrincipleSeries([entry["investment"] for entry in entries])
    balanceSeries = createBalanceSeries(entries)
    expectedSeries = createExpectedSeries(entries, 0.08)

    ySeries = [principleSeries, balanceSeries, expectedSeries]

    print("Plotting data...")
    createPlot(dates, ySeries, seriesNames, colors)

#------------------- Data manipulation methods -------------------#

def createPrincipleSeries(values):
    series = []
    runningTotal = 0.0
    for value in values:
        runningTotal += value
        series.append(runningTotal)
    return series

def createBalanceSeries(entries):
    series = []
    runningTotal = 0.0
    for entry in entries:
        runningTotal += entry["earnings"]
        runningTotal += entry["investment"]
        series.append(runningTotal)
    return series

def createExpectedSeries(entries, annualReturnRate):
    series = []
    runningTotal = 0.0
    for i in range(0, len(entries)):
        entry = entries[i]

        totalPeriods = daysInYear(stringToDate(entry["date"]).year)
        returnPerPeriod = (1.0 + annualReturnRate) ** (1.0 / totalPeriods) - 1.0
        numPeriods = (stringToDate(entry["date"]) - stringToDate(entries[i-1]["date"])).days

        runningTotal = runningTotal * ((1.0 + returnPerPeriod) ** numPeriods)
        runningTotal += entry["investment"]
        print(runningTotal)
        series.append(runningTotal)
    return series

#------------------- Output methods -------------------#

def createPlot(dates, ySeries, seriesNames, colors):
    x = [dt.datetime.strptime(d,'%m/%d/%Y').date() for d in dates]
    
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%m/%d/%Y'))
    plt.gca().xaxis.set_major_locator(mdates.DayLocator())
    
    plt.plot(x, ySeries[0], label=seriesNames[0], color=colors[0], marker=".")
    plt.plot(x, ySeries[1], label=seriesNames[1], color=colors[1], marker=".")
    plt.plot(x, ySeries[2], label=seriesNames[2], color=colors[2], marker=".")


    daysCovered = (x[-1] - x[0]).days
    numXTicks = 20 if len(x) > 20 else len(x)
    xTickGap = int(len(x) / numXTicks)
    xTicks = x[::xTickGap]
    plt.xticks(xTicks, rotation=45)

    y_max = max([value for series in ySeries for value in series])
    y_step = y_max / 20
    y_max_rounded = (int(y_max / y_step) + 2) * y_step
    y_range = np.arange(y_max_rounded, step=y_step)
    plt.yticks(y_range, ['$%d' % (value) for value in y_range])

    plt.title('Financial Returns Over Time')
    plt.legend(loc='upper left')

    plt.show()

#------------------- ------------------- -------------------#

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python returnsPlot.py <source.csv>")
        exit()
    file_name = sys.argv[1]
    main(file_name)
