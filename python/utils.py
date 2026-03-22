"""
Makes a number a nice factor of 10
"""
def get_factor_of_ten(num):
    i = 0
    while(10**i < num):
        i += 1
    return 10**i