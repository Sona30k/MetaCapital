import numpy as np

def calculate_score(returns):
    avg = np.mean(returns)
    std = np.std(returns)

    if std == 0:
        return 0

    return avg / std

def allocate(scores):
    adjusted = {k: max(v, 0) for k, v in scores.items()}
    total = sum(adjusted.values())

    allocation = {}

    for k in adjusted:
        if total == 0:
            allocation[k] = 0
        else:
            allocation[k] = round((adjusted[k] / total) * 300, 2)

    return allocation

def calculate_metrics(returns):
    import numpy as np

    total_return = sum(returns)
    max_drawdown = min(returns)
    sharpe = calculate_score(returns)

    return {
        "total_return": total_return,
        "max_drawdown": max_drawdown,
        "sharpe": sharpe
    }